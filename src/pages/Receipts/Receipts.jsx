import React, { Component } from "react";
import axios from "axios";
import styles from "./Receipts.module.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://localhost:${import.meta.env.VITE_PORT || 3002}`;


//✅ png, jpg, jpeg, gif → will be compressed (downscaled + quality reduced).
//❌ pdf, doc, docx, txt, csv, xlsx, zip → skipped (they are just passed through unchanged).

class Receipts extends Component {
  constructor() {
    super();
    const currentYear = new Date().getFullYear();

    this.state = {
      receipts: [],
      uploading: false,
      selectedFile: null,
      previewUrl: null,
      error: null,

      year: currentYear.toString(),
      property_id: 0,
      expenseType: "",
      expense: "",
      amount: "",
      description: "",
      currentYear,

      properties: [],

      originalFileSize: null,
      compressedFileSize: null,

      showSuccessModal: false,
      modalFadingOut: false,
    };
  }

  componentDidMount() {
    this.fetchReceipts();
    this.fetchProperties();
  }

  componentDidUpdate(prevProps, prevState) {
    const token = localStorage.getItem("token");
    if (!token && this.state.receipts.length > 0) {
      this.setState({
        receipts: [],
        error: "Sign Up or Log In to use this feature!",
      });
    }
  }

  formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB"];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(2)} ${units[i]}`;
  };

  compressImage = (file, maxWidth = 600, quality = 0.4) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) return resolve(file);

      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target.result);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxWidth / img.width, 1);
        const width = img.width * scale;
        const height = img.height * scale;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = reject;
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  fetchProperties = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/api/properties/names`, {
        headers: this.getAuthHeaders(),
      });
      const properties = res.data.idList.map((id, i) => ({
        id,
        name: res.data.names[i],
      }));
      this.setState({ properties });
    } catch (err) {
      console.error("Failed to fetch properties:", err);
      this.setState({ error: "Failed to fetch properties" });
    }
  };

  getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  fetchReceipts = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      this.setState({ error: "Sign Up or Log In to use this feature!" });
    } else {
      try {
        const res = await axios.get(`${API_BASE}/api/receipts/get-all`, {
          headers: this.getAuthHeaders(),
        });
        this.setState({ receipts: res.data.receipts || [] });
      } catch (err) {
        console.error(err);
        this.setState({ error: "Failed to fetch receipts" });
      }
    }
  };

  handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Only skip if it's the same as currently previewed AND not uploaded
    if (this.state.selectedFile && this.state.selectedFile.name === file.name && this.state.selectedFile !== null) {
      return; // do nothing
    }

    try {
      const compressed = await this.compressImage(file);
      if (this.state.previewUrl) URL.revokeObjectURL(this.state.previewUrl);
      this.setState({
        selectedFile: compressed,
        previewUrl: URL.createObjectURL(compressed),
        originalFileSize: file.size,
        compressedFileSize: compressed.size,
      });

      // Reset the input so the same file can be selected after upload
      e.target.value = null;
    } catch (err) {
      console.error("Image compression failed:", err);
      this.setState({
        selectedFile: file,
        previewUrl: URL.createObjectURL(file),
        originalFileSize: file.size,
        compressedFileSize: file.size,
      });

      e.target.value = null;
    }
  };

  fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (err) => reject(err);
    });

  handleUpload = async () => {
    const {
      selectedFile,
      year,
      property_id,
      expenseType,
      expense,
      amount,
      description,
    } = this.state;

    if (!selectedFile) return alert("Select a file first!");
    if (!year || !expenseType || !expense || !amount) {
      return alert("Please fill all required fields before uploading.");
    }

    this.setState({ uploading: true, error: null });

    try {
      const fileBase64 = await this.fileToBase64(selectedFile);
      const res = await axios.post(
        `${API_BASE}/api/receipts/upload`,
        {
          fileName: selectedFile.name,
          fileBase64,
          mimeType: selectedFile.type,
          year,
          property_id,
          expenseType,
          expense,
          amount: parseFloat(amount).toFixed(2),
          description,
        },
        { headers: this.getAuthHeaders() }
      );

      this.setState((prev) => ({
        receipts: [res.data.receipt, ...prev.receipts],
        selectedFile: null,
        previewUrl: null,
        uploading: false,
        year: this.state.currentYear.toString(),
        property_id: 0,
        expenseType: "",
        expense: "",
        amount: "",
        description: "",
        originalFileSize: null,
        compressedFileSize: null,
        showSuccessModal: true,   // 👈 show modal
      }));

      // 👇 auto-close modal after 2.25s
      setTimeout(() => {
        this.setState({ modalFadingOut: true }); // start fade out

        // remove modal after animation duration
        setTimeout(() => {
          this.setState({ showSuccessModal: false, modalFadingOut: false });
        }, 250); // matches CSS fadeOut duration
      }, 2000);
    } catch (err) {
      console.error(err);
      this.setState({ error: "Upload failed", uploading: false });
    }
  };

  render() {
    const {
      receipts,
      uploading,
      selectedFile,
      previewUrl,
      error,
      year,
      property_id,
      expenseType,
      expense,
      amount,
      description,
      currentYear,
      properties,
      originalFileSize,
      compressedFileSize,
      showSuccessModal,
      modalFadingOut
    } = this.state;

    const yearOptions = Array.from({ length: 8 }, (_, i) =>
      (currentYear - i).toString()
    );

    const deductibleOptions = [
      "Insurance Premiums",
      "Maintenance",
      "Utilities",
      "Repairs",
      "Other",
    ];
    const capitalOptions = [
      "Building Improvements",
      "Furniture",
      "Equipment",
      "Other",
    ];
    const expenseOptions =
      expenseType === "deductible"
        ? deductibleOptions
        : expenseType === "capital"
        ? capitalOptions
        : [];

    // 👇 detect mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    return (
      <>
        <div className={styles.container}>
          <h2 className={styles.title}>Receipts</h2>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formSection}>
            {/* Year */}
            <select
              className={styles.select}
              value={year}
              onChange={(e) => this.setState({ year: e.target.value })}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* Property */}
            <select
              className={styles.select}
              value={property_id}
              onChange={(e) =>
                this.setState({ property_id: Number(e.target.value) })
              }
            >
              
              <option value={0}>-- Select Property (optional) --</option>
              {this.props.user ? 
                properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                )) : this.props.defaultOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              }
            </select>

            {/* Expense Type */}
            <select
              className={styles.select}
              value={expenseType}
              onChange={(e) =>
                this.setState({ expenseType: e.target.value, expense: "" })
              }
            >
              <option value="">-- Select Expense Type --</option>
              <option value="capital">Capital</option>
              <option value="deductible">Deductible</option>
            </select>

            {/* Expense */}
            <select
              className={styles.select}
              value={expense}
              onChange={(e) => this.setState({ expense: e.target.value })}
              disabled={!expenseType}
            >
              <option value="">-- Select Expense --</option>
              {expenseOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Amount */}
            <input
              type="text"
              className={styles.input}
              placeholder="Amount"
              value={amount}
              onChange={(e) => {
                let value = e.target.value.replace(/[^0-9.]/g, "");
                const parts = value.split(".");
                if (parts.length > 2) value = parts[0] + "." + parts[1];
                this.setState({ amount: value });
              }}
              onBlur={(e) => {
                let num = parseFloat(e.target.value);
                if (isNaN(num) || num < 0) num = 0;
                this.setState({ amount: num.toFixed(2) });
              }}
            />

            {/* Description */}
            <input
              type="text"
              className={styles.input}
              placeholder="Description (100 character limit)"
              maxLength={100}
              value={description}
              onChange={(e) => this.setState({ description: e.target.value })}
            />
          </div>

          <div className={styles.uploadSection}>
            <div className={styles.fileGroup}>
              {isMobile ? (
                <>
                  {/* Mobile: both camera and file selection */}
                  <label htmlFor="camera-upload" className={styles.fileLabel}>
                    📷 Scan Receipt
                  </label>
                  <input
                    id="camera-upload"
                    type="file"
                    className={styles.fileInput}
                    accept="image/*"
                    capture="environment"
                    onChange={this.handleFileChange}
                  />

                  <label htmlFor="file-upload-mobile" className={styles.fileLabel}>
                    📁 Choose File
                  </label>
                  <input
                    id="file-upload-mobile"
                    type="file"
                    className={styles.fileInput}
                    accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
                    onChange={this.handleFileChange}
                  />
                </>
              ) : (
                <>
                  {/* Desktop: only choose file */}
                  <label htmlFor="file-upload" className={styles.fileLabel}>
                    📁 Choose File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className={styles.fileInput}
                    accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
                    onChange={this.handleFileChange}
                  />
                </>
              )}
              {this.state.selectedFile ? (
                <span>Selected: {this.state.selectedFile.name}</span>
              ) : (
                <span>No file chosen</span>
              )}
            </div>

            <button
              onClick={this.handleUpload}
              disabled={
                uploading ||
                !selectedFile ||
                !year ||
                !expenseType ||
                !expense ||
                !amount ||
                !localStorage.getItem("token") ||
                (compressedFileSize > 1024 * 1024)
              }
              className={styles.uploadButton}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>

          {(originalFileSize || compressedFileSize) && (
            <div className={styles.fileInfo}>
              <p>
                <strong>Original size:</strong>{" "}
                {this.formatFileSize(originalFileSize)}
              </p>
              <p>
                <strong>Compressed size:</strong>{" "}
                {this.formatFileSize(compressedFileSize)}
                {compressedFileSize > 1024 * 1024 && (
                  <span className={styles.fileError}>
                    {" "}⚠ Must be under 1 MB to upload
                  </span>
                )}
              </p>
            </div>
          )}

          {previewUrl && (
            <div className={styles.previewSection}>
              <p>Preview:</p>
              <img
                src={previewUrl}
                alt="Preview"
                className={styles.previewImage}
              />
            </div>
          )}

          <div className={styles.receiptsList}>
            {receipts.length === 0 && <p>No receipts yet.</p>}
            <ul>
              {receipts.map((r) => (
                <li key={r.id} className={styles.receiptItem}>
                  {r.signed_url ? (
                    <a href={r.signed_url} target="_blank" rel="noopener noreferrer">
                      View Receipt
                    </a>
                  ) : (
                    <span>File not available</span>
                  )}
                  <span className={styles.receiptDate}>
                    ({new Date(r.created_at).toLocaleString()})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {showSuccessModal && (
          <div className={`${styles.modalOverlay} ${modalFadingOut ? styles.fadeOut : ''}`}>
            <div className={styles.modalContent}>
              <h3>✅ Upload Successful!</h3>
              <p>Your receipt has been uploaded.</p>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default Receipts;

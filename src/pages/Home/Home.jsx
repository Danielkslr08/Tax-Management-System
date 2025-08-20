import { Component } from "react";
import styles from "./Home.module.css";

class HomePage extends Component {
  generateStreaks = (count = 30) => {
    return Array.from({ length: count }).map((_, i) => {
      const top = `${Math.random() * 100}%`;
      const left = `${Math.random() * 100}%`;
      const delay = `${(Math.random() * 6).toFixed(2)}s`;
      const duration = `${(1.5 + Math.random()).toFixed(2)}s`;

      return (
        <div
          key={i}
          className={styles.streak}
          style={{
            top,
            left,
            animationDelay: delay,
            animationDuration: duration,
          }}
        />
      );
    });
  };

  render() {
    return (
      <div className={styles.wrapper}>
        <div className={styles.visualBackground}>{this.generateStreaks()}</div>

        <main className={styles.homepageContainer}>
          <h2 className={styles.homepageTitle}>{this.props.user ? "Welcome " + this.props.user.email : "Tax Management System"}</h2>
          <p className={styles.homepageSubtitle}>
            Simplify and automate your tax record keeping with a reliable system
            designed to track business mileage and related expenses.
          </p>

          <section>
            <h2 className={styles.sectionTitle}>Key Features</h2>
            <div className={styles.cards}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Automated Mileage Logs</h3>
                <p className={styles.cardText}>
                  Record every trip and optimize deductions.
                </p>
              </div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Expense Tracking</h3>
                <p className={styles.cardText}>
                  Log all your travel-related costs easily.
                </p>
              </div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Report Generation</h3>
                <p className={styles.cardText}>
                  Generate IRS-compliant summaries.
                </p>
              </div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Multi-Property Support</h3>
                <p className={styles.cardText}>
                  Manage travel per property efficiently.
                </p>
              </div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Secure Data</h3>
                <p className={styles.cardText}>
                  Keep your logs encrypted and safe.
                </p>
              </div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Easy to Use</h3>
                <p className={styles.cardText}>
                  Clean UI for minimal friction.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.infoSection}>
            <h2 className={styles.sectionTitle}>Who Is This For?</h2>
            <p className={styles.infoText}>
              Tailored for real estate agents, contractors, freelancers, and
              small business owners who need to stay compliant while managing
              complex travel logs and deductions.
            </p>
          </section>
        </main>

        <footer className={styles.footer}>
          © {new Date().getFullYear()} Tax Management System. All rights reserved.
        </footer>
      </div>
    );
  }
}

export default HomePage;

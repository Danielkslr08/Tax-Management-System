import { Component } from 'react';
import styles from './SignUpForm.module.css';
import axios from 'axios';

class SignUp extends Component {
  constructor() {
    super();
    this.state = {
      email: '',
      password: '',
      confirmPassword: '',
      error: '',
    };
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, error: '' });
  };

  handleSubmit = (e) => {
    e.preventDefault();

    const { email, password, confirmPassword } = this.state;

    if (!email || !password || !confirmPassword) {
      return this.setState({ error: 'Please fill in all fields.' });
    }

    if (password !== confirmPassword) {
      return this.setState({ error: 'Passwords do not match.' });
    }

    axios.post('/api/add-user', {
      email: email,
      password: password,
    })
    .then(response => {
      const user = response.data;

      // Save JWT to localStorage
      localStorage.setItem('token', user.token);

      this.props.logUserIn(user);
    })
    .catch(err => {
      // err.response.data.error contains your custom message
      this.setState({ error: err.response?.data?.error || 'Something went wrong.' });
    });

    this.setState({
      email: '',
      password: '',
      confirmPassword: '',
      error: '',
    });
  };

  render() {
    const { email, password, confirmPassword, error } = this.state;

    return (
      <div className={styles.container}>
        <form className={styles.form} onSubmit={this.handleSubmit}>
          <h2 className={styles.title}>Create Account</h2>

          {error && <div className={styles.error}>{error}</div>}

          <label className={styles.label}>
            Email
            <input
              type="email"
              name="email"
              value={email}
              onChange={this.handleChange}
              className={styles.input}
              required
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              type="password"
              name="password"
              value={password}
              onChange={this.handleChange}
              className={styles.input}
              required
            />
          </label>

          <label className={styles.label}>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={this.handleChange}
              className={styles.input}
              required
            />
          </label>

          <button type="submit" className={styles.button}>
            Sign Up
          </button>
        </form>
      </div>
    );
  }
}

export default SignUp;

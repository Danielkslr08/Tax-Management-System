import { Component } from 'react';
import styles from './LogInForm.module.css';
import axios from 'axios';

class LogIn extends Component {

  constructor() {
    super();
    this.state = {
      email: '',
      password: '',
      error: '',
    };
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, error: '' });
  };

  handleSubmit = (e) => {
    e.preventDefault();

    const { email, password } = this.state;

    if (!email || !password) {
      return this.setState({ error: 'Please fill in all fields.' })
    }

    axios.post('/api/login', {
        email: email,
        password: password, // In production, hash this before or on the server
      },
      { 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
    .then(response => {
      const user = response.data

      // Save JWT to localStorage
      localStorage.setItem('token', user.token);

      this.props.logUserIn(user)
      
      this.setState({ error: '', email: '', password: '' })
    })
    .catch(err => {
      if (err.response && err.response.data && err.response.data.error) {
        this.setState({ error: err.response.data.error });
      } else {
        this.setState({ error: 'An error occurred. Try again.' })
      }
    });
  };

  render() {
    const { email, password, error } = this.state;

    return (
      <div className={styles.container}>
        <form className={styles.form} onSubmit={this.handleSubmit}>
          <h2 className={styles.title}>Access Your Account</h2>

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

          <button type="submit" className={styles.button}>
            Log In
          </button>
        </form>
      </div>
    );
  }
}

export default LogIn;

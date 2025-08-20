import { Component, createRef } from "react";
import { Link } from "react-router-dom";
import styles from './NavBar.module.css';
import ConfirmModal from "../ConfirmModal/ConfirmModal";

class NavBarComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showConfirm: false
        }

        this.tabRefs = []
    }

    componentDidMount() {
        const activeRef = this.tabRefs.find(ref => ref?.current?.classList.contains(styles.active));
        if (activeRef?.current) {
            activeRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            const activeRef = this.tabRefs.find(ref => ref?.current?.classList.contains(styles.active));
            if (activeRef?.current) {
            activeRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }
        }
    }

    logoutAttempt = (e) => {
        e.currentTarget.blur(); // remove lingering focus highlight
        e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); // 👈 scroll it into view
        this.setState({ showConfirm: true })
    }

    logoutCancel = () => {
        this.setState({ showConfirm: false })
    }

    logoutConfirm = () => {
        this.setState({ showConfirm: false })
        this.props.onLogout()
    }

    render() {
        const path = this.props.location.pathname;

        const lastIndex = this.props.data.length - 2;
        // Left-side links
        const leftLinks = this.props.data.slice(0, lastIndex);
        // Right-side links (Sign up, Login)
        let rightLinks = this.props.data.slice(lastIndex);

        if (this.props.user) {
            //rightLinks = rightLinks.filter(link => !["Sign Up", "Log In"].includes(link));
            rightLinks = [
                'emailDisplay',  // placeholder to show email disabled button
                'Log Out'
            ]
        }

        let visibleLinks = [...leftLinks, ...rightLinks];
        this.tabRefs = visibleLinks.map(() => createRef());

        let refIndex = 0;

        const leftNavLinks = leftLinks.map((link, index) => {
            let address = "/" + encodeURI(link);
            if (index === 0) {
                address = "/";
            }

            const isActive = path === address;

            return (
                <li className={styles["tab-item"]} key={index}>
                    <Link
                        ref={this.tabRefs[refIndex++]}
                        to={address}
                        className={`${styles.tab} ${isActive ? styles.active : ""}`}>
                        {link}
                    </Link>
                </li>
            );
        });

        const rightNavLinks = rightLinks.map((link, index) => {
            if (this.props.user) {
                if (index == 0) {
                    // disabled button showing email
                    return (
                        <li className={styles["tab-item"]} key={'emailDisplay'}>
                            <button
                                ref={this.tabRefs[refIndex++]}
                                disabled
                                className={`${styles.tab} ${styles.disabledButton}`}
                                title="Your account email"
                            >
                                {this.props.user.email}
                            </button>
                        </li>
                    )
                } else if (index == 1) {
                    // Log out button
                    return (
                        <li className={styles["tab-item"]} key={'logout'}>
                            <button
                                ref={this.tabRefs[refIndex++]}
                                className={`${styles.tab} ${styles.logoutButton}`}
                                onClick={e => this.logoutAttempt(e)}  // you will pass this prop
                            >
                                Log Out
                            </button>
                        </li>
                    );
                }
            } else {
                const address = "/" + encodeURI(link);

                const isActive = path === address;

                return (
                    <li className={styles["tab-item"]} key={index}>
                        <Link
                            ref={this.tabRefs[refIndex++]}
                            to={address}
                            className={`${styles.tab} ${isActive ? styles.active : ""}`}>
                            {link}
                        </Link>
                    </li>
                );
            }
        });

        return (
            <>
                <div className={styles["navbar-row"]}>
                    <h1 className={styles["navbar-title"]}>Tax Management System</h1>
                    <div className={styles["tabs-wrapper"]} tabIndex="0" onKeyDown={this.handleKeyDown}>
                        <ul className={`${styles.tabs} ${styles["custom-tabs"]}`}>
                            {leftNavLinks}
                            <li className={styles.spacer} />
                            {rightNavLinks}
                        </ul>
                    </div>
                </div>

                {this.state.showConfirm && <ConfirmModal onYes={this.logoutConfirm} onNo={this.logoutCancel} text="Are you sure you want to log out?"/>}
            </>
        );
    }
}
export default NavBarComponent;

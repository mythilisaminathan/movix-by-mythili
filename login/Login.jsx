import { useEffect, useRef, useState } from "react";
import "./styles.scss";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import validateCredentials from "../../utils/validate";
import { auth } from "../../utils/firebase";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	updateProfile,
} from "firebase/auth";
import { useDispatch } from "react-redux";
import { setAuth } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";

const Login = () => {
	const [isInputActive, setInputActive] = useState("");
	const [signIn, setSignIn] = useState(true);
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const dispatch = useDispatch();
	const navigate = useNavigate();

	const nameRef = useRef(null);
	const emailRef = useRef(null);
	const passwordRef = useRef(null);

	const handleSubmit = (e) => {
		e.preventDefault();

		const email = emailRef.current.value;
		const password = passwordRef.current.value;
		const name = nameRef.current.value;
		const isValid = validateCredentials(email, password);

		if (isValid !== "Credentials are valid") {
			setErrorMessage(isValid);
		}

		setErrorMessage("");
		setIsLoading(true);
		if (!signIn) {
			createUserWithEmailAndPassword(auth, email, password, name)
				.then((userCredential) => {
					const user = userCredential.user;
					updateProfile(user, {
						displayName: name,
					})
						.then(() => {
							const { uid, email, displayName } = auth.currentUser;
							dispatch(setAuth({ uid, email, displayName }));
							localStorage.setItem(
								"user",
								JSON.stringify({ uid, email, displayName })
							);
							navigate("/");
						})
						.catch((error) => {
							setErrorMessage(error.message);
						});
				})
				.catch((error) => {
					const errorMessage = error.message;
					setErrorMessage(errorMessage);
				})
				.finally(() => {
					setIsLoading(false);
				});
		} else {
			signInWithEmailAndPassword(auth, email, password)
				.then((userCredential) => {
					const user = userCredential.user;
					const { uid, email, displayName } = user;
					dispatch(setAuth({ uid, email, displayName }));
					localStorage.setItem(
						"user",
						JSON.stringify({ uid, email, displayName })
					);
					navigate("/");
				})
				.catch((error) => {
					const errorMessage = error.message;
					setErrorMessage(errorMessage);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	};

	return (
		<>
			<Header />
			<div className="containerr">
				<div className="small-container">
					{signIn && (
						<>
							<p>Sample user id: user@gmail.com</p>
							<p>password: User@1234</p>
						</>
					)}
					<h1>{signIn ? "Welcome Back!" : "Create Account"}</h1>
					<form onSubmit={handleSubmit}>
						<div className={`form-control ${signIn && "hidden"}`}>
							<input
								ref={nameRef}
								className={`${
									(isInputActive === "name" ||
										(nameRef.current && nameRef.current.value !== "")) &&
									"active-input"
								}`}
								type="text"
								required={signIn ? false : true}
								onFocus={() => setInputActive("name")}
							/>
							<label>Name</label>
						</div>
						<div className="form-control">
							<input
								ref={emailRef}
								className={`${
									(isInputActive === "email" ||
										(emailRef.current && emailRef.current.value !== "")) &&
									"active-input"
								}`}
								type="email"
								required
								onFocus={() => setInputActive("email")}
								name="email"
							/>
							<label>Email</label>
						</div>
						<div className="form-control">
							<input
								ref={passwordRef}
								className={`${
									(isInputActive === "psw" ||
										(passwordRef.current &&
											passwordRef.current.value !== "")) &&
									"active-input"
								}`}
								type="password"
								required
								onFocus={() => setInputActive("psw")}
								name="password"
							/>
							<label>Password</label>
						</div>
						<p>{errorMessage}</p>
						<button className="btn" disabled={isLoading}>
							{signIn ? "Log in" : "Create Account"}
						</button>

						{signIn ? (
							<p className="text">
								Don't have an account?{" "}
								<span onClick={() => setSignIn(false)}>Register</span>
							</p>
						) : (
							<p className="text">
								Already have an account?{" "}
								<span onClick={() => setSignIn(true)}>Log in</span>
							</p>
						)}
					</form>
				</div>
			</div>
			<Footer />
		</>
	);
};

export default Login;

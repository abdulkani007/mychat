import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase";
import axios from "axios";

function Login() {
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const provider = new GoogleAuthProvider();

  const googleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const emailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:4000/api/login", {
        email,
        password
      });

      
      const fakeUser = {
        uid: response.data.user.uid,
        email: response.data.user.email,
        displayName: response.data.user.displayName,
        photoURL: response.data.user.photoURL,
        getIdToken: async () => response.data.token
      };
      
      
      localStorage.setItem("fakeUser", JSON.stringify(fakeUser));
      localStorage.setItem("fakeToken", response.data.token);
      
      
      window.dispatchEvent(new CustomEvent('fakeLogin', { detail: fakeUser }));
    } catch (error) {
      alert("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "0 20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        padding: "40px 35px",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        width: "420px",
        textAlign: "center",
        backdropFilter: "blur(10px)"
      }}>
        {/* App Title */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{
            margin: "0 0 8px 0",
            fontWeight: "700",
            fontSize: "32px",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "1px"
          }}>
            MyChat
          </h1>
          <p style={{
            margin: 0,
            fontSize: "16px",
            color: "#6b7280",
            fontWeight: "400"
          }}>
            Connect instantly with your friends
          </p>
        </div>

        {!isEmailLogin ? (
          // Google Login View
          <div>
            <button
              onClick={googleLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                border: "2px solid #e5e7eb",
                background: "white",
                borderRadius: "12px",
                fontSize: "16px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                color: "#374151",
                fontWeight: "500",
                marginBottom: "20px",
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => !loading && (e.target.style.transform = "translateY(0)")}
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                width="22"
                alt="Google Logo"
              />
              <span>{loading ? "Signing in..." : "Continue with Google"}</span>
            </button>

            <div style={{
              display: "flex",
              alignItems: "center",
              margin: "25px 0",
              color: "#9ca3af"
            }}>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }}></div>
              <span style={{ padding: "0 15px", fontSize: "14px" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }}></div>
            </div>

            <button
              onClick={() => setIsEmailLogin(true)}
              style={{
                width: "100%",
                padding: "14px 20px",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                color: "white",
                fontWeight: "500"
              }}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              Sign in with Email
            </button>
          </div>
        ) : (
          
          <form onSubmit={emailLogin}>
            <div style={{ textAlign: "left", marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151"
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter any email"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <div style={{ textAlign: "left", marginBottom: "25px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151"
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter any password"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 20px",
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #667eea, #764ba2)",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                color: "white",
                fontWeight: "500",
                marginBottom: "15px"
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => !loading && (e.target.style.transform = "translateY(0)")}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              onClick={() => setIsEmailLogin(false)}
              style={{
                width: "100%",
                padding: "12px 20px",
                background: "transparent",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                color: "#6b7280",
                fontWeight: "500"
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#9ca3af";
                e.target.style.color = "#374151";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.color = "#6b7280";
              }}
            >
              Back to Google Login
            </button>
          </form>
        )}

        <div style={{
          marginTop: "25px",
          padding: "15px",
          background: "#f3f4f6",
          borderRadius: "10px",
          fontSize: "13px",
          color: "#6b7280",
          lineHeight: "1.4"
        }}>
          <strong>Demo Mode:</strong> Email login accepts any credentials for testing purposes.
        </div>
      </div>
    </div>
  );
}

export default Login;
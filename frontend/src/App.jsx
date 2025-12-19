import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./Login";
import Chat from "./Chat";

function App() {
  const [user, setUser] = useState(() => {
    const fakeUser = localStorage.getItem("fakeUser");
    return fakeUser ? JSON.parse(fakeUser) : null;
  });

  useEffect(() => {

    
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else if (!localStorage.getItem("fakeUser")) {
        setUser(null);
      }
    });

 
    const handleFakeLogin = (e) => {
      setUser(e.detail);
    };
    window.addEventListener('fakeLogin', handleFakeLogin);

    return () => {
      unsub();
      window.removeEventListener('fakeLogin', handleFakeLogin);
    };
  }, []);

  if (!user) return <Login />;

  return <Chat user={user} />;
}

export default App;

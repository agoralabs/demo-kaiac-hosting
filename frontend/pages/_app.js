import '../styles/globals.css';
import Navbar from '../components/Navbar';
import { Toaster } from 'react-hot-toast';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <div className="pt-16">
        <Component {...pageProps} />
        <Toaster 
          position="top-center"
          toastOptions={{
            success: {
              style: {
                background: '#4BB543',
                color: 'white',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#4BB543',
              },
            },
            error: {
              style: {
                background: '#FF3333',
                color: 'white',
              },
            },
          }}
        />
      </div>
    </>
  );
}

export default MyApp;
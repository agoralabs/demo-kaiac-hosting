import '../styles/globals.css';
import Navbar from '../components/Navbar';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <div className="pt-16">
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp;
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Nav from '../components/nav'
import { MyVariableProvider } from '../context/MyVariableContext';  // Add this line

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <MyVariableProvider>  
        <div className="main">
          <div className="nav">
            <div>
              <Nav />
            </div>
          </div>
          <div className="component">
            <Component {...pageProps} />
          </div>
        </div>
    </MyVariableProvider>  
  );
}

export default MyApp;

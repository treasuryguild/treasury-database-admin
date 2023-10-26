import { useState, useEffect } from "react";
import axios from 'axios';
import type { NextPage } from "next";
import { useMyVariable } from '../context/MyVariableContext';
import styles from '../styles/Wallets.module.css';
import Papa from 'papaparse';
import SnetFixComponent from '../components/SnetFixComponent'
import { getTransactions } from '../utils/getTransactions';

const SnetFix: NextPage = () => {
  const { myVariable, setMyVariable } = useMyVariable();

  useEffect(() => {
    setMyVariable(prevState => ({ 
        ...prevState, 
        transactions: [], 
        csvDoc: [], 
        gitHubTxs: [], 
        databaseTxs: [] 
    }));
    getTxsCsv();
  }, []);

  useEffect(() => {
   console.log(myVariable); 
  }, [myVariable]);

  async function getTxsCsv() {
    // If the file is public and in the public folder
    const csvFilePath = "/SnetTreasuryDoc.csv";
    
    Papa.parse(csvFilePath, {
      download: true,
      complete: function(results: any) {
        console.log("CSV results:", results.data);
        setMyVariable(prevState => ({
          ...prevState,
          csvDoc: results.data,
        }));
      }
    });
  }

  function extractTxIdFromContent(base64Content: string): string | null {
    try {
      // Decode the base64 content
      const decodedContent = atob(base64Content);
  
      // Parse the JSON object
      const parsedContent = JSON.parse(decodedContent);
  
      // Return the txid
      return parsedContent.txid || null;
    } catch (error) {
      console.error('Error in extracting txid:', error);
      return null;
    }
  }
  

  async function getGitHub() {
    const githubApiUrl = 'https://api.github.com/repos/treasuryguild/treasury-system-v4/git/trees/main?recursive=1';
    
    try {
      const response = await axios.get(githubApiUrl);
      const files = response.data.tree.filter((file: any) => file.path.startsWith("Transactions/Singularity-Net/TreasuryWallet/Singularity-Net-Ambassador-Wallet/bulkTransactions"));
      
      const jsonFiles: any = [];
      const txidToFileMap: any = {};

      for (const file of files) {
        const fileData = await axios.get(file.url);
        const txid = fileData?.data?.content ? extractTxIdFromContent(fileData.data.content.trim()) : null;

        if (txid) {
          txidToFileMap[txid] = { filename: file.path, sha: file.sha };
        }
        // Extract UNIX timestamp from the filename
        const timestampMatch = file.path.match(/(\d+)-Singularity-Net-bulkTransaction\.json/);
        let formattedDate = null;
      
        if (timestampMatch && timestampMatch[1]) {
          const timestamp = timestampMatch[1];
          const date = new Date(Number(timestamp));
      
          // Format the date to "14.02.23"
          const year = date.getUTCFullYear().toString().substr(-2);
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
      
          formattedDate = `${day}.${month}.${year}`;
        }
      
        try {
          const cleanStr = fileData.data.content.trim().replace(/[\r\n]+/gm, "");
          const fileContent = JSON.parse(atob(cleanStr));
          
          // Include the formatted date inside each parsed JSON content
          fileContent.transactionDate = formattedDate;
          
          jsonFiles.push(fileContent);
          
        } catch (e) {
          console.error('Error decoding base64:', e);
        }
      }
  
      setMyVariable(prevState => ({
        ...prevState,
        gitHubTxs: jsonFiles,
        txidToFileMap: txidToFileMap,
      }));
  
    } catch (error) {
      console.error('Error fetching GitHub files:', error);
    }
  }
  
  async function getTxs() {
    let txs: any = await getTransactions("722294ef-c9e4-4b2f-8779-a3f7caf4f28d");
    setMyVariable(prevState => ({
        ...prevState,
        databaseTxs: txs,
      }));
    console.log("database txs", txs)
  }
  
  return (
    <div>
      <div className={styles.container}>
        <button onClick={getGitHub}>getGitHub</button>
        <button onClick={getTxs}>getTxs</button>
      </div>
      <div>
        <SnetFixComponent />
      </div>
    </div>
  );
};

export default SnetFix;

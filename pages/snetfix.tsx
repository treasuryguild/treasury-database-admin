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
   console.log(myVariable) 
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

  async function getGitHub() {
    const githubApiUrl = 'https://api.github.com/repos/treasuryguild/treasury-system-v4/git/trees/main?recursive=1';
    
    try {
      const response = await axios.get(githubApiUrl);
      const files = response.data.tree.filter((file: any) => file.path.startsWith("Transactions/Singularity-Net/TreasuryWallet/Singularity-Net-Ambassador-Wallet/bulkTransactions"));
      
      const jsonFiles: any = [];
  
      for (const file of files) {
        const fileData = await axios.get(file.url);
  
        try {
          const cleanStr = fileData.data.content.trim().replace(/[\r\n]+/gm, "");
          const fileContent = atob(cleanStr);
          jsonFiles.push(JSON.parse(fileContent));
        } catch (e) {
          console.error('Error decoding base64:', e);
        }
      }
  
      setMyVariable(prevState => ({
        ...prevState,
        gitHubTxs: jsonFiles,
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

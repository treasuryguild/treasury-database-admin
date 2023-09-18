import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useMyVariable } from '../context/MyVariableContext';
import styles from '../styles/Wallets.module.css';
import { getWalletsFromSheet } from '../utils/getWalletsFromSheet'

const Wallets: NextPage = () => {
  const { myVariable, setMyVariable } = useMyVariable();

  useEffect(() => {
    setMyVariable(prevState => ({ ...prevState, transactions: [] }));
  }, [setMyVariable]);

  async function getWallets() {
    let result = await getWalletsFromSheet();
    console.log("Getting wallets", result);
  }
  
  return (
    <div>
      <div className={styles.container}>
       wallets
       <button onClick={getWallets}>Update wallets</button>
      </div>
    </div>
  );
};

export default Wallets;
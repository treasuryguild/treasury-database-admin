import React from 'react';
import { deleteTransactions } from '../utils/deleteTransactions'
import { processTxInfo } from '../utils/processTxInfo'
import { updateDatabase } from '../utils/updateDatabase'

interface ManageDatabaseProps {
    myVariable: any;
    groupName: string;
    projectName: string;
  }

  const ManageDatabase: React.FC<ManageDatabaseProps> = ({ myVariable, groupName, projectName }) => {
    
    console.log("myVariable inside Database management", myVariable)

    async function deleteTxs() {
        const status = await deleteTransactions(myVariable.projectInfo.project_id);
        console.log("deleting txs", status)
    }

    async function updateBalances(updates: any, data: any) {
        // Create a deep copy of the updates object so the original is not mutated
        let localUpdates = JSON.parse(JSON.stringify(updates));
    
        // ... your existing code
        const txDate = new Date(data.transaction_date);
        const yearMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!localUpdates['monthly_budget_balance'][yearMonth]) {
            const lastMonth = `${txDate.getFullYear()}-${String(txDate.getMonth()).padStart(2, '0')}`;
            localUpdates['monthly_budget_balance'][yearMonth] = localUpdates['monthly_budget_balance'][lastMonth] ? { ...localUpdates['monthly_budget_balance'][lastMonth] } : {};
        }
    
        const txType = data.tx_type;
        const tokens = data.total_tokens;
        const amounts = data.total_amounts ? data.total_amounts.map((amount: string) => parseFloat(amount)) : [];
    
        let adaChange = 0;
    
        if (tokens && tokens.length > 0) {
            for (let i = 0; i < tokens.length; i++) {
                if (!localUpdates['monthly_budget_balance'][yearMonth][tokens[i]]) {
                    localUpdates['monthly_budget_balance'][yearMonth][tokens[i]] = 0;
                }
                const amount = amounts[i];
                if (txType === 'Incoming') {
                    localUpdates['monthly_budget_balance'][yearMonth][tokens[i]] += amount;
                } else {
                    localUpdates['monthly_budget_balance'][yearMonth][tokens[i]] -= amount;
                }
                
                localUpdates['monthly_budget_balance'][yearMonth][tokens[i]] = parseFloat(localUpdates['monthly_budget_balance'][yearMonth][tokens[i]].toFixed(2));
                if (tokens[i] === "ADA") {
                    adaChange += amounts[i];
                }
            }
        }
    
        if (txType === 'Incoming') {
            localUpdates['wallet_balance_after'] += adaChange;
        } else {
            localUpdates['wallet_balance_after'] -= adaChange;
        }
    
        localUpdates['wallet_balance_after'] = parseFloat(localUpdates['wallet_balance_after'].toFixed(6));
    
        return localUpdates;
    }
    
    async function insertTxs() {
        let updates: any = {};
        let balanceUpdates: any = {}
        balanceUpdates['monthly_budget_balance'] = {};
        balanceUpdates['wallet_balance_after'] = 0;
    
        for (let idx in myVariable.transactionInfo) {
            let data: any = processTxInfo(myVariable.transactionInfo[idx], myVariable);
            let updatedBalances = await updateBalances(balanceUpdates, data);
            balanceUpdates = updatedBalances;
            updates = { ...balanceUpdates, ...data };
            console.log("inserting txs", updatedBalances, updates);
        }
    }            

    return (
        <div>
            <h2>Database management</h2>
            <p>Delete and insert all txs at once</p>
            <button onClick={deleteTxs} className="navitems">
            Delete All Txs
            </button>
            <button onClick={insertTxs} className="navitems">
            insert All Txs
            </button>
        </div>
    );
};

export default ManageDatabase;

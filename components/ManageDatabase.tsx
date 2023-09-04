import React from 'react';
import { deleteTransactions } from '../utils/deleteTransactions'
import { processTxInfo } from '../utils/processTxInfo'
import { processMonthlyBudget } from '../utils/processMonthlyBudget'
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
        const tokenObject = data.total_tokens.reduce((obj: any, token: any, index: any) => ({ ...obj, [token]: parseFloat(data.total_amounts[index]) }), {});

        let result: any = {
            'monthly_budget_balance': {},
            'wallet_balance_after': 0
        }
        //result = {...updates}
        result = JSON.parse(JSON.stringify(updates));

        // Extract necessary data
        const transactionDate = new Date(data.transaction_date);
        const transactionYear = transactionDate.getFullYear();
        const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
        const transactionKey = `${transactionYear}-${transactionMonth}`;
        
        // Initialize if month doesn't exist
        if(!result.monthly_budget_balance[transactionKey]) {
            const previousMonth = new Date(data.transaction_date);
            previousMonth.setMonth(previousMonth.getMonth() - 1);
            const previousMonthKey = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
            result.monthly_budget_balance[transactionKey] = {...(result.monthly_budget_balance[previousMonthKey] || {})};
        }

        const adaAmount = parseFloat(data.total_amounts[data.total_tokens.indexOf('ADA')]).toFixed(6);
        
        data.total_tokens.forEach((token: any, index: any) => {
            const amount = parseFloat(data.total_amounts[index]);
            if(!result.monthly_budget_balance[transactionKey][token]) {
                result.monthly_budget_balance[transactionKey][token] = "0.00";
            }
            const currentBalance = parseFloat(result.monthly_budget_balance[transactionKey][token]);
            if(data.tx_type === "Incoming") {
                result.monthly_budget_balance[transactionKey][token] = (currentBalance + amount).toFixed(6);
            } else if (data.tx_type == "RewardsWithdrawal") {
                if (token == 'ADA') {
                    result.monthly_budget_balance[transactionKey][token] = (currentBalance + amount - (parseFloat(data.fee)/1000000)).toFixed(6);
                } else {
                    result.monthly_budget_balance[transactionKey][token] = (currentBalance + amount).toFixed(6);
                }
            } else {
                if (token == 'ADA') {
                    result.monthly_budget_balance[transactionKey][token] = (currentBalance - (amount + (parseFloat(data.fee)/1000000))).toFixed(6);
                } else {
                    result.monthly_budget_balance[transactionKey][token] = (currentBalance - amount).toFixed(6);
                }  
            }
        });

        if (data.tx_type == "Incoming") {
            result['wallet_balance_after'] = Number(result['wallet_balance_after']) + Number(adaAmount)
            
        } else if (data.tx_type == "RewardsWithdrawal") {
            result['wallet_balance_after'] = Number(result['wallet_balance_after']) + Number(adaAmount) - (parseFloat(data.fee)/1000000)
        } else {
            result['wallet_balance_after'] = (Number(result['wallet_balance_after']) - (Number(adaAmount) + (parseFloat(data.fee)/1000000)))
        }
        result['wallet_balance_after'] = parseFloat(result['wallet_balance_after']).toFixed(6)
        //console.log("updateBalances", updates, data, result)
        return result;
    }
    
    async function insertTxs() {
        let txData: any = {}
        let updates: any = {};
        let balanceUpdates: any = {}
        balanceUpdates['monthly_budget_balance'] = {};
        balanceUpdates['wallet_balance_after'] = 0;
    
        for (let idx in myVariable.transactionInfo) {
            let data: any = processTxInfo(myVariable.transactionInfo[idx], myVariable);
            let updatedBalances = await processMonthlyBudget(balanceUpdates, data);
            balanceUpdates = updatedBalances;
            updates = { ...balanceUpdates, ...data };
            txData[idx] = {}
            txData[idx] = myVariable.transactionInfo[idx]
            txData[idx]['txData'] = updates
            let status = await updateDatabase(txData[idx].txMetadata.metadata, updates.transaction_id, myVariable, updates);
            console.log("inserting txs", status);
            //console.log("inserting txs", updatedBalances, updates);
        }
        console.log("txData", txData)
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

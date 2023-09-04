export async function processMonthlyBudget(updates: any, data: any) {
    
    async function updateBalances() {
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
        console.log("updateBalances", updates, data, result)
        return result;
    }
  let monthly_budget = await updateBalances();

  return monthly_budget;
}
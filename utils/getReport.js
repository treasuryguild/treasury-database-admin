export async function getReport(txs) {
  
  async function generateReport() {
    let localReport = {};
    txs.forEach(tx => {
      const taskDate = new Date(parseInt(tx.transaction_date));
      const monthYear = `${taskDate.getMonth() + 1}.${taskDate.getFullYear()}`;

      if (!localReport[monthYear]) {
        localReport[monthYear] = {};
      }

      if (tx.tx_type === "Outgoing") {
        tx.contributions.forEach(contribution => {
          const workgroup = contribution.task_sub_group || "not-recorded";
          if (!localReport[monthYear]) localReport[monthYear] = {};
          if (!localReport[monthYear][workgroup]) localReport[monthYear][workgroup] = {};

          contribution.distributions.forEach(distribution => {
            distribution.tokens.forEach((token, index) => {
              const amount = distribution.amounts[index];
              if (!localReport[monthYear][workgroup][token]) localReport[monthYear][workgroup][token] = 0;
              localReport[monthYear][workgroup][token] += Number(amount);
            });
          });
        });
      }

      // Add total-distribution
      if (tx.tx_type !== "Incoming") {
        if (!localReport[monthYear]['total-distribution']) localReport[monthYear]['total-distribution'] = {};
        
        tx.total_tokens.forEach((token, index) => {
          const amount = tx.total_amounts[index];
          if (!localReport[monthYear]['total-distribution'][token]) localReport[monthYear]['total-distribution'][token] = 0;
          localReport[monthYear]['total-distribution'][token] += Number(amount);
        });
      }
    });
    return localReport;
  }

  function processIncomingTransactions(txs, existingReport) {
    let localReport = { ...existingReport };
    txs.forEach(tx => {
      if (tx.tx_type === "Incoming") {
        const AGIXIndex = tx.total_tokens.indexOf('AGIX');
        if (AGIXIndex >= 0 && tx.total_amounts[AGIXIndex] > 10) {
          const transactionDate = new Date(parseInt(tx.transaction_date));
          let taskDate;
          if (transactionDate.getDate() > (new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 0).getDate() - 10)) {
            taskDate = new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 1);
          } else {
            taskDate = transactionDate;
          }

          const monthYear = `${taskDate.getMonth() + 1}.${taskDate.getFullYear()}`;
          if (!localReport[monthYear]) localReport[monthYear] = {};
          if (!localReport[monthYear]['monthly-budget']) localReport[monthYear]['monthly-budget'] = {};
          if (!localReport[monthYear]['monthly-budget']['AGIX']) localReport[monthYear]['monthly-budget']['AGIX'] = 0;
          localReport[monthYear]['monthly-budget']['AGIX'] += Number(tx.total_amounts[AGIXIndex]);
        }
      }
    });
    return localReport;
  }

  let report = await generateReport();
  report = processIncomingTransactions(txs, report);

  return report;
}

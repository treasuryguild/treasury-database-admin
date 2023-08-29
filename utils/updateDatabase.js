import { supabase } from "../lib/supabaseClient";

async function deleteExistingContributionsAndDistributions(tx_id, project_id) {
    try {
      // Delete existing distributions
      const { error: deleteDistributionError } = await supabase
        .from('distributions')
        .delete()
        .eq('tx_id', tx_id)
        .eq('project_id', project_id);
  
      if (deleteDistributionError) throw deleteDistributionError;
  
      // Delete existing contributions
      const { error: deleteContributionError } = await supabase
        .from('contributions')
        .delete()
        .eq('tx_id', tx_id)
        .eq('project_id', project_id);
  
      if (deleteContributionError) throw deleteContributionError;
  
    } catch (error) {
      alert(error.message);
    }
}

export async function updateDatabase(metadata, transaction_id, myVariable) {
  const project_id = myVariable.projectInfo.project_id;
  const { contributions, msg } = metadata;

  async function updateTransactions() {
    try {
      const total_tokens = [];
      const total_amounts = [];
  
      msg.forEach((message) => {
        const match = message.match(/(\d+) USD in (\d+) (\w+)/);
        if (match) {
          total_amounts.push(match[2]);
          total_tokens.push(match[3]);
        }
      });
  
      // Check if the transaction_id and project_id already exist in the table
      const { data: existingRows, error: fetchError } = await supabase
        .from('transactions')
        .select('tx_id')
        .eq('transaction_id', transaction_id)
        .eq('project_id', myVariable.projectInfo.project_id);
  
      if (fetchError) throw fetchError;
  
      let tx_id;
      if (existingRows.length > 0) {
        // Update the existing row
        tx_id = existingRows[0].tx_id;
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ total_tokens, total_amounts })
          .eq('tx_id', tx_id);
  
        if (updateError) throw updateError;
      } else {
        // Insert new row
        const { data, error: insertError } = await supabase
          .from('transactions')
          .insert([{ total_tokens, total_amounts, transaction_id, project_id: myVariable.projectInfo.project_id }]);
  
        if (insertError) throw insertError;
        tx_id = data[0].tx_id;
      }
  
      return tx_id;
  
    } catch (error) {
      alert(error.message);
    }
  }  

  async function updateContributions(tx_id) {
    try {
      const promises = contributions.map(async (contribution) => {
        const { data, error } = await supabase
          .from('contributions')
          .upsert([{ task_name: contribution.name, task_label: contribution.label, tx_id }]);

        if (error) throw error;

        return data[0].id; // Assuming the first record is the one you want
      });

      return await Promise.all(promises);

    } catch (error) {
      alert(error.message);
    }
  }

  async function updateDistributions(contribution_ids) {
    try {
      const promises = contributions.map(async (contribution, index) => {
        const contribution_id = contribution_ids[index];
  
        for (const contributor in contribution.contributors) {
          const tokensObj = contribution.contributors[contributor];
          let tokensArray = [];
          let amountsArray = [];
  
          for (const token in tokensObj) {
            const amount = tokensObj[token];
            tokensArray.push(token);
            amountsArray.push(amount);
          }
  
          await supabase
            .from('distributions')
            .upsert([{ 
              contributor_id: contributor, 
              tokens: tokensArray, 
              amounts: amountsArray, 
              contribution_id 
            }]);
        }
      });
  
      await Promise.all(promises);
  
    } catch (error) {
      alert(error.message);
    }
  }  

  
  const id = await updateTransactions();
  await deleteExistingContributionsAndDistributions(id, project_id);
  const contribution_ids = await updateContributions(id);
  await updateDistributions(contribution_ids);

  return "done";
}

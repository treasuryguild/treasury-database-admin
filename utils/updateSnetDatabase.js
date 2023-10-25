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

export async function updateSnetDatabase(metadata, transaction_id) {
  const project_id = "722294ef-c9e4-4b2f-8779-a3f7caf4f28d";
  const { contributions, msg } = metadata;

  async function updateTransactions() {
    try {
  
      // Check if the transaction_id and project_id already exist in the table
      const { data: existingRows, error: fetchError } = await supabase
        .from('transactions')
        .select('tx_id, tx_json')
        .eq('transaction_id', transaction_id)
        .eq('project_id', project_id);
  
      if (fetchError) throw fetchError;
  
      let tx_id;
      let tx_json;
      if (existingRows.length > 0) {
        // Update the existing row
        tx_id = existingRows[0].tx_id;
        tx_json = existingRows[0].tx_json;
        console.log("Existing tx_id", tx_id, metadata, tx_json)
        /*let txData = {tx_json: metadata}
        const { error: updateError } = await supabase
          .from('transactions')
          .update( txData )
          .eq('tx_id', tx_id);*/
  
        //if (updateError) throw updateError;
      } else {
        console.log("tx didnt exist")
      }
  
      return tx_id;
  
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }  

  async function updateContributions(tx_id) {
    try {
      const promises = contributions.map(async (contribution) => {
        const task_name = contribution.name ? contribution.name.join(' ') : null;
        const task_date = contribution?.arrayMap?.date?.join(',') || null;
        const task_sub_group = contribution?.arrayMap?.subGroup?.join(',') || null;
        const task_array_map = contribution.arrayMap ? contribution.arrayMap : null;
        const task_description = contribution.description ? contribution.description.join(' ') : null;
        const task_label = (contribution?.arrayMap?.label && contribution.arrayMap.label.length > 0) ? contribution.arrayMap.label.join(',') : (Array.isArray(contribution.label) ? contribution.label.join(',') : (contribution.label ? contribution.label : null));
        
         // First, check if a record with the tx_id, project_id, and task_name already exists
          const { data: existingRecords, error: fetchError } = await supabase
          .from('contributions')
          .select('contribution_id, task_name, task_description')
          .eq('tx_id', tx_id)
          .eq('project_id', project_id)
          .eq('task_name', task_name || task_description);
    
        if (fetchError) throw fetchError;

        const updates = {
          project_id,
          tx_id,
          task_creator: "Singularity Net",
          task_name: task_name,
          task_label: task_label,
          task_description: task_description,
          task_date: task_date,
          task_sub_group: task_sub_group,
          task_array_map: task_array_map,
          task_type: "Outgoing",
        }
        console.log("existingRecords", existingRecords)
        if (existingRecords.length > 0) {
            console.log("existingRecords[0].contribution_id", existingRecords[0].contribution_id, existingRecords, updates)
            return existingRecords[0].contribution_id  //delete this one when you uncomment below
            /*
            // Update existing record
            const { error: updateError } = await supabase
              .from('contributions')
              .update(updates)
              .eq('contribution_id', existingRecords[0].contribution_id);  // Assuming first record is the one you want
    
            if (updateError) throw updateError;
    
            return existingRecords[0].contribution_id;
          } else {
            // Insert new record
            const { data, error: insertError } = await supabase
              .from('contributions')
              .insert([updates])
              .select('contribution_id');
    
            if (insertError) throw insertError;
    
            return data[0].contribution_id;  // Assuming the first record is the one you want
*/
          }
        });
    
        return await Promise.all(promises);
      } catch (error) {
        alert(error.message);
      }
    }

    async function updateDistributions(contribution_ids, tx_id) {
        try {
          const promises = contributions.map(async (contribution, index) => {
            const contribution_id = contribution_ids[index];
      
            for (const contributor in contribution.contributors) {
              const tokensObj = contribution.contributors[contributor];
              let tokensArray = [];
              let amountsArray = [];
      
              for (const token in tokensObj) {
                const amount = tokensObj[token];
                if (token == 'gimbal') {
                  tokensArray.push('GMBL');
                } else {
                  tokensArray.push(token);
                }
                
                amountsArray.push(amount);
              }
              const updates = { 
                contributor_id: contributor, 
                tokens: tokensArray, 
                amounts: amountsArray, 
                contribution_id,
                project_id,
                tx_id
              }
      
              await supabase
                .from('distributions')
                .upsert([updates]);
            }
          });
      
          await Promise.all(promises);
      
        } catch (error) {
          alert(error.message);
        }
      }  
  const tx_id = await updateTransactions();
  //await deleteExistingContributionsAndDistributions(id, project_id);
  console.log(tx_id)
  const contribution_ids = await updateContributions(tx_id);
  //await updateDistributions(contribution_ids, tx_id);
  console.log("update Database", metadata, transaction_id, contribution_ids)
  return "done";
}

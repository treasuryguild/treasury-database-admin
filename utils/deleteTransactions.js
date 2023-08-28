import { supabase } from "../lib/supabaseClient";
  
export async function deleteTransactions(project_id) {
    
    async function deleteDistributions() {
        try {
    
          let { data, error, status } = await supabase
            .from('distributions')
            .delete()
            .eq('project_id',project_id)
            
          if (error && status !== 406) throw error
    
          if (data) {
            console.log("distributions",data)
          }
        } catch (error) {
          alert(error.message)
        } 
      }
    
      async function deleteContributions() {
        
        try {
      
            let { data, error, status } = await supabase
              .from('contributions')
              .delete()
              .eq('project_id',project_id)
              
            if (error && status !== 406) throw error
      
            if (data) {
              console.log("contributions",data)
            }
          } catch (error) {
            alert(error.message)
          } 
        }
    
      async function deleteTransactions() {
        
        try {
            
            let { data, error, status } = await supabase
              .from('transactions')
              .delete()
              .eq('project_id',project_id)
              
            if (error && status !== 406) throw error
      
            if (data) {
              console.log("transactions",data)
            }
          } catch (error) {
            alert(error.message)
          } 
        }
      
      await deleteDistributions()
      await deleteContributions()
      await deleteTransactions()

  return "done";
}
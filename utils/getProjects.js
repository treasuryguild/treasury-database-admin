import { supabase } from "../lib/supabaseClient";
  let projects = []
  
export async function getProjects(address) {
    async function getGroupDetails() {
      try {
        const { data, error, status } = await supabase
        .from("groups")
        .select('group_name, logo_url, group_id, projects(project_id, project_name, wallet)')
        
        if (error && status !== 406) throw error
        if (data) {
          projects = data
        }
      } catch (error) {
        if (error) {
          alert(error.message);
        } else {
          console.error('Unknown error:', error);
        }
      }
    }
    
  await getGroupDetails();

  return projects
}
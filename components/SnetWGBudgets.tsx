import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SnetWGBudgetsProps {
  myVariable: any;
  groupName: string;
  projectName: string;
}

const SnetWGBudgets: React.FC<SnetWGBudgetsProps> = ({ myVariable, groupName, projectName }) => {
  const [workgroups, setWorkgroups] = useState<any[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<{ [key: string]: string }>({});
  const [quarters, setQuarters] = useState<string[]>([]);

  useEffect(() => {
    getWorkgroups();
    generateQuarters();
  }, []);

  async function getWorkgroups() {
    let { data, error } = await supabase
      .from('subgroups')
      .select('sub_group, budgets')
      .eq('project_id', myVariable.projectInfo.project_id);
    if (error) console.log('error', error);
    console.log("workgroups", data);
    setWorkgroups(data || []);
  }

  function generateQuarters() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);

    const generatedQuarters = [];
    for (let i = -2; i <= 1; i++) {
      const year = currentQuarter + i <= 0 ? currentYear - 1 : currentYear;
      const quarter = (((currentQuarter + i - 1) % 4) + 4) % 4;
      generatedQuarters.push(`B${year}Q${quarter + 1}`);
    }

    setQuarters(generatedQuarters);

    const initialSelectedTokens: { [key: string]: string } = {};
    generatedQuarters.forEach((quarter) => {
      initialSelectedTokens[quarter] = 'AGIX';
    });
    setSelectedTokens(initialSelectedTokens);
  }

  async function updateBudgets() {
    for (const workgroup of workgroups) {
      const updatedBudgets: any = {};
      quarters.forEach((quarter) => {
        const [year, q] = quarter.slice(1).split('Q');
        if (!updatedBudgets[`B${year}`]) {
          updatedBudgets[`B${year}`] = {};
        }
        if (!updatedBudgets[`B${year}`][`Q${q}`]) {
          updatedBudgets[`B${year}`][`Q${q}`] = {};
        }
        updatedBudgets[`B${year}`][`Q${q}`] = {
          ...workgroup.budgets[`B${year}`]?.[`Q${q}`],
          [selectedTokens[quarter]]: workgroup.budgets[`B${year}`]?.[`Q${q}`]?.[selectedTokens[quarter]] || 0,
        };
      });
      const { error } = await supabase
        .from('subgroups')
        .update({ budgets: updatedBudgets })
        .eq('sub_group', workgroup.sub_group)
        .eq('project_id', myVariable.projectInfo.project_id);
      if (error) console.log('error', error);
    }
  
    /*
    const totalBudgetPerQuarter: { [key: string]: number } = {};
    quarters.forEach((quarter) => {
      totalBudgetPerQuarter[quarter] = workgroups.reduce((sum, workgroup) => {
        if (workgroup.sub_group !== 'ambassador-program') {
          const [year, q] = quarter.slice(1).split('Q');
          return sum + (workgroup.budgets[`B${year}`]?.[`Q${q}`]?.[selectedTokens[quarter]] || 0);
        }
        return sum;
      }, 0);
    });
  
    const ambassadorsBudget: any = {};
    quarters.forEach((quarter) => {
      const [year, q] = quarter.slice(1).split('Q');
      const remainingBudget = 144258 - totalBudgetPerQuarter[quarter];
      if (!ambassadorsBudget[`B${year}`]) {
        ambassadorsBudget[`B${year}`] = {};
      }
      ambassadorsBudget[`B${year}`][`Q${q}`] = {
        [selectedTokens[quarter]]: remainingBudget,
      };
    });
  
    const { error } = await supabase
      .from('subgroups')
      .update({ budgets: ambassadorsBudget })
      .eq('sub_group', 'ambassador-program')
      .eq('project_id', myVariable.projectInfo.project_id);
    if (error) console.log('error', error);
    */
    getWorkgroups();
  }

  return (
    <div>
      <h2>Database management</h2>
      <p>Insert budget amounts for each workgroup</p>
      <table>
        <thead>
          <tr>
            <th>Workgroup</th>
            {quarters.map((quarter) => (
              <th key={quarter}>
                {quarter}
                <select
                  value={selectedTokens[quarter]}
                  onChange={(e) => setSelectedTokens({ ...selectedTokens, [quarter]: e.target.value })}
                >
                  <option value="AGIX">AGIX</option>
                  <option value="ASI">ASI</option>
                </select>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {workgroups.map((workgroup) => (
            <tr key={workgroup.sub_group}>
              <td>{workgroup.sub_group}</td>
              {quarters.map((quarter) => {
                const [year, q] = quarter.slice(1).split('Q');
                return (
                  <td key={quarter}>
                    <input
                      type="number"
                      value={workgroup.budgets[`B${year}`]?.[`Q${q}`]?.[selectedTokens[quarter]] || ''}
                      onChange={(e) => {
                        const updatedBudgets = {
                          ...workgroup.budgets,
                          [`B${year}`]: {
                            ...workgroup.budgets[`B${year}`],
                            [`Q${q}`]: {
                              ...workgroup.budgets[`B${year}`]?.[`Q${q}`],
                              [selectedTokens[quarter]]: Number(e.target.value),
                            },
                          },
                        };
                        const updatedWorkgroups = workgroups.map((wg) =>
                          wg.sub_group === workgroup.sub_group ? { ...wg, budgets: updatedBudgets } : wg
                        );
                        setWorkgroups(updatedWorkgroups);
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={updateBudgets}>Update Budgets</button>
    </div>
  );
};

export default SnetWGBudgets;
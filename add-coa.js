import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
<<<<<<< HEAD
p.chartOfAccounts.createMany({
  data:[
    {account_code:'1100',account_name:'Cash',account_type:'Asset',description:'Cash account'},
    {account_code:'4100',account_name:'Sales Revenue',account_type:'Revenue',description:'Revenue account'},
    {account_code:'5100',account_name:'Operating Expense',account_type:'Expense',description:'Expense account'}
  ]
}).then(r=>{
  console.log('✅ Created',r.count,'accounts');
  p.$disconnect();
}).catch(e=>{
  console.error('Error:',e.message);
  p.$disconnect();
});
=======
try {
  const result = await p.chartOfAccounts.createMany({
    data:[
      {account_code:'1100',account_name:'Cash',account_type:'Asset',description:'Cash account'},
      {account_code:'4100',account_name:'Sales Revenue',account_type:'Revenue',description:'Revenue account'},
      {account_code:'5100',account_name:'Operating Expense',account_type:'Expense',description:'Expense account'}
    ]
  });
  console.log('✅ Created',result.count,'accounts');
  await p.$disconnect();
} catch (error) {
  console.error('Error:',error.message);
  await p.$disconnect();
}
>>>>>>> origin/main

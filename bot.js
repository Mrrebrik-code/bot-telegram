const { Telegraf, Markup } = require('telegraf')
const { createClient } = require('@supabase/supabase-js');
const token = '5264404869:AAHqC-YbRstUMAQo62OVwjNHmmoQdxL9xZU';

const apiSupabase = "https://opslbkbxnzgfapmztpuh.supabase.co";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2xia2J4bnpnZmFwbXp0cHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDkxODgwMTgsImV4cCI6MTk2NDc2NDAxOH0.4l58i9tDErg90QLlPFL-5tfXm3ajJy7MOobvTCRH2GA";

const supabase = createClient(apiSupabase, publicAnonKey);


const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply('Welcome!'));

let isAuthNickName = false;
let isPasswordEnter = false;

bot.command('register', async (ctx) => {
    if(isAuthNickName == false && isPasswordEnter == false){
         await ctx.reply('Please enter yor nickname:');
         isAuthNickName = true;
    }
   
});

bot.command('login', async (ctx) => {
    if(isAuthNickName == false && isPasswordEnter == false){
         await ctx.reply('Please enter yor nickname:');
         isAuthNickName = true;
    }
   
});

bot.command("test", async (ctx, next) =>{
    await ctx.reply('OK! - ' + ctx.message.text);
     await next();
     await ctx.reply('OK! - ' + ctx.message.user_id);
    
})


let nickname = "";
let password = "";
bot.on('text', async (ctx) =>{
   if(isAuthNickName == true){
       await ctx.reply('OK!');
       isAuthNickName = false;
       nickname = ctx.message.text;
       await ctx.reply('Please enter password:');
       isPasswordEnter = true;
       console.log(isPasswordEnter);
       return;
   }
   if(isPasswordEnter == true){
       await ctx.reply('OK!');
       password = ctx.message.text;
       isPasswordEnter = false;
       await supabase.from('users').insert(
        [
            { 
                id: 1, nickname: nickname, password: password
            },
        ])
       return;
   } 
});

    
bot.action('btn_1', async(ctx) => { 
    await ctx.reply("Good evry one!");
});

bot.command('hipster', Telegraf.reply('λ'))
bot.launch();
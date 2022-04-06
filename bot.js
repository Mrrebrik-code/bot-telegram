const { Telegraf, Markup, Scenes, Stage, session } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const token = '5264404869:AAHqC-YbRstUMAQo62OVwjNHmmoQdxL9xZU';

const apiSupabase = "https://opslbkbxnzgfapmztpuh.supabase.co";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2xia2J4bnpnZmFwbXp0cHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDkxODgwMTgsImV4cCI6MTk2NDc2NDAxOH0.4l58i9tDErg90QLlPFL-5tfXm3ajJy7MOobvTCRH2GA";

const supabase = createClient(apiSupabase, publicAnonKey);

const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply('Welcome!'));

const loginWizard = new Scenes.WizardScene(
    'login',
    async (ctx) => {
        await ctx.replyWithHTML(`Nickname:`);
        return ctx.wizard.next()
	},
    async (ctx) => {
        let nickname = ctx.message.text
        let user = await supabase.from('users').select('nickname').eq('nickname', nickname);
        
        if(user.data.length != 0){
            ctx.session.nickname = nickname;
            
            await ctx.replyWithHTML(`Password:`);
            return ctx.wizard.next()
        } else{
            await ctx.reply('Такого пользователя нет в базе данных!');
            return ctx.wizard.back()
        }
	},
    async (ctx) => {
        let {nickname} = ctx.session;
        
        let user = await supabase.from('users').select('nickname, password').eq('nickname', nickname);
        if(ctx.message.text == user.data[0].password){
            await ctx.reply(user);
            await ctx.reply('Успешно авторизированы!');
        }
        else{
            await ctx.reply('Не верный пароль!');
        }
        
        return ctx.scene.leave()
	}
);

const registerWizard = new Scenes.WizardScene(
    'register',
    async (ctx) =>{
        await ctx.replyWithHTML(`<b>Registration!</b>`);
        await ctx.replyWithHTML(`Please enter you nickname:`);
    }
);



const stage = new Scenes.Stage([loginWizard, registerWizard]);
bot.use(session()); // to  be precise, session is not a must have for Scenes to work, but it sure is lonely without one
bot.use(stage.middleware());

bot.command('login', async (ctx) => {
    await ctx.scene.enter('login');
});

bot.command('register', async (ctx) =>{
   await ctx.scene.enter('register'); 
});



 

bot.launch();
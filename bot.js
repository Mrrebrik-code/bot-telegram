const { Telegraf, Markup, Scenes, Stage, session } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const token = '5264404869:AAHqC-YbRstUMAQo62OVwjNHmmoQdxL9xZU';

const apiSupabase = "https://opslbkbxnzgfapmztpuh.supabase.co";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2xia2J4bnpnZmFwbXp0cHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDkxODgwMTgsImV4cCI6MTk2NDc2NDAxOH0.4l58i9tDErg90QLlPFL-5tfXm3ajJy7MOobvTCRH2GA";

const supabase = createClient(apiSupabase, publicAnonKey);

const bot = new Telegraf(token);



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

const createformUser = new Scenes.WizardScene(
    'create-formUser',
    async (ctx) =>{
        let user = await supabase.from('users').select('userId, name').eq('userId', ctx.message.chat.id);
        if(user.data.length != 0){
            await ctx.reply('Добпый день, ' + user.data[0].name + "! Мы рады вас видеть снова!");
            return ctx.scene.leave()
        }
        
        await ctx.reply('Как вас зовут?');
        return ctx.wizard.next();
    },
    async (ctx) =>{
        ctx.session.name = ctx.message.text;
        
        await ctx.reply('Сколько вам лет?');
        return ctx.wizard.next();
    },
    async (ctx) =>{
        ctx.session.year = ctx.message.text;
        let {name} = ctx.session
        let {year} = ctx.session
        const isSave = await saveDatabaseUser(ctx.message.chat.id, name, year);
    
        if(isSave){
            await ctx.reply('Хорошо! Мы вас сохранили в базу данных!');
            return ctx.scene.leave()
        }
        else{
            await ctx.reply('Произошел сбой!');
            return ctx.scene.leave()
        }
        
        
    }
);


async function saveDatabaseUser(userId, name, year){
    let user = await  supabase
            .from('users')
            .insert(
            [ 
                { 
                    userId: userId, 
                    name: name, 
                    year: year
                }
            ]);
    if(user.data.length != 0){
        return true;
    }
    else{
        return false;
    }
    
}

const sendMessageScene = new Scenes.WizardScene(
    'send-message',
     async (ctx) =>{
        await ctx.reply('Введите сообщение!');
        await bot.telegram.sendMessage('1246913274', ctx.message.text);
        
        return ctx.scene.leave()
     }
);
const test = Markup
    .keyboard([
      ['\ud83d\udc4d', '\ud83d\udc4e', 'Закончить'],
    ]);
    

const searchUsers = new Scenes.WizardScene(
    'search-users',
    async (ctx) =>{
        ctx.session.indexUser = 1;
        await ctx.reply('Вы хотите начать поиск людей?', test.oneTime().resize());
        return ctx.wizard.next();
    },
    async (ctx) =>{
        if(ctx.message.text == "Закончить"){
            await ctx.reply('Подождем пока кто-то увидит твою анкету');
            await ctx.reply('Меню', Markup
    .keyboard([
      ['ИСКАТЬ ЛЮДЕЙ', 'МОЙ АЙДИ'],
    ])
    .oneTime()
    .resize()
  )
            return ctx.scene.leave();
        }
        await ctx.reply("Нашли кое-кого для тебя ;)", test.oneTime().resize());
        let user = await supabase.from('users').select('userId, name, year').eq('id', ctx.session.indexUser);
         return ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' },
    {
      caption: `${user.data[0].name}  -  ${user.data[0].year} лет.`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('\ud83d\udc4d', 'plain'),
        Markup.button.callback('\ud83d\udc4e', 'italic'),
        Markup.button.callback('\u2709\ufe0f', 'italic')
      ])
    }
  )
        
        ctx.session.indexUser += await 1;
    }// 
);
bot.command('caption', (ctx) => {
 
})




const stage = new Scenes.Stage([loginWizard, registerWizard, createformUser, sendMessageScene, searchUsers]);
bot.use(session()); // to  be precise, session is not a must have for Scenes to work, but it sure is lonely without one
bot.use(stage.middleware());

bot.command('login', async (ctx) => {
    await ctx.scene.enter('login');
});

bot.command('start', async (ctx) => {
    await ctx.reply('Вас приветствует бот знакомств для разрбатчиков! \ud83e\uddd1\u200d\ud83d\udcbb', Markup
    .keyboard([
      ['ИСКАТЬ ЛЮДЕЙ', 'МОЙ АЙДИ'],
    ])
    .oneTime()
    .resize()
  )
    await ctx.scene.enter('create-formUser'); 
  
})

bot.command('register', async (ctx) =>{
   await ctx.scene.enter('register'); 
});

bot.hears('МОЙ АЙДИ', async (ctx) =>{
   await  ctx.reply("Your user ID: " + ctx.message.chat.id);
});

bot.hears('ИСКАТЬ ЛЮДЕЙ', async (ctx) =>{
   await ctx.scene.enter('search-users'); 
});

 

bot.launch();
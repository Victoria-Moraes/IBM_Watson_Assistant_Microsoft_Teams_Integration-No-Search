// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });
var replytext;
var session;
var session_expired="false";
const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
		
class MyBOT extends ActivityHandler {
    constructor() {
        super();
		
		//Create new Assistant Instance
		const assistant = new AssistantV2({
						  version: '2022-07-01',
						  authenticator: new IamAuthenticator({
							apikey: process.env.APIKey,
						  }),
						  url: process.env.AssistantURL,
						});		
						
        this.onMessage(async (context, next) => {
			
				//Create a new session if not already created or is expired
				if (session == null || (typeof session === 'undefined')) {
					
					session = await assistant.createSession({
					  assistantId: process.env.AssistantID
					})
					  .then(res => {
						return res.result.session_id
					  })
					  .catch(err => {
						console.log(err);
					  });
				}
				
				//Send a message to Watson Assistant. I've handled Text and Options type of responses
				var replyText = await assistant.message({
						assistantId: process.env.AssistantID,
						sessionId: session,
						input: {
						  'message_type': 'text',
						  'text': context.activity.text
						  }
						})
						.then(res => {
						  if (res.result.output.generic[0].response_type == 'option'){
							  var options_res = res.result.output.generic[0].title + "\n"
									 var i = 1
									 var j = 0
									 for (var item in res.result.output.generic[0].options) {
												options_res = options_res + i + ". " +  res.result.output.generic[0].options[item].label + "\n"
									 }
									 return options_res
						  }
						  else
						  {
							  var normal_res;
							  for (var item in res.result.output.generic){
								  if (res.result.output.generic[item].text == '')
								  {
								  }
								  else
								  {
									 return res.result.output.generic[item].text
								  }
							  }
							 
							  
						  }
							
						})
						.catch(err => {
						  //If the session is expired, the program will send a dummy response to user. 
						  //And will try creating a new one so we set the value of session to null
						  console.log(err);
						  session = null
						  return "Sorry! Your session was timeout so I do not understand. Can you say that again?"
						});
		
		await context.sendActivity(MessageFactory.text(replyText, replyText));
		// By calling next() you ensure that the next BotHandler is run.
		 await next();
				  
        });
		
		//Send intial message when BOT is installed
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            //const welcomeText = 'Hello! How may I help?';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    //await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
	
}

module.exports.MyBOT = MyBOT;

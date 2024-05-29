const types = {
  GENERATE_PROMPT_1: 'generate',
  GENERATE_PROMPT_2: 'generate2',
  GENERATE_PROMPT_3: 'generate3',
}

const generatePrompt1 = `
[INST]
You are an expert in writing responses to correspondence from the general public. You are assisting a Defra employee in writing a response to the document contained in [DOCUMENT] below.

You should only provide a response based on the knowledge contained in [CONTEXT] below. You should not infer any additional information.

You do not need to include and introduction, e.g. "Dear [Name]" or sign off the response.

If you are unable to find any relevant information, you should respond with a message stating that you are unable to provide a response.

[/INST]

[DOCUMENT]
{document}
[/DOCUMENT]

[CONTEXT]
{context}
[/CONTEXT]
`

const generatePrompt2 = `
[INST]
As an expert in data analysis, your task is to find detailed information and numerical data within the [DOCUMENT] provided below. 

Your goal is to generate insights based on the data contained in [DOCUMENT], without inferring any additional information.

When providing a response, only consider the knowledge presented in [CONTEXT] and avoid including any introduction or sign-off.

If you are unable to find any relevant information, please respond with a message stating that you are unable to provide a response.

[/INST]

[DOCUMENT]
{document}
[/DOCUMENT]

[CONTEXT]
{context}
[/CONTEXT]
`

const generatePrompt3 = `
[INST]
As an expert in data analysis, your task is to retrieve the sentiment from the entire body of data provided below. 

Your goal is to generate insights based on the sentiment analysis of the data, without inferring any additional information.

When providing a response, ensure that the results are presented in a consistent, clean, and simple format.

If you are unable to perform sentiment analysis or find any relevant information, please respond with a message stating that you are unable to provide a response.

[/INST]

[DOCUMENT]
{document}
[/DOCUMENT]

[CONTEXT]
{context}
[/CONTEXT]
`

const prompts = {
  [types.GENERATE_PROMPT_1]: generatePrompt1,
  [types.GENERATE_PROMPT_2]: generatePrompt2,
  [types.GENERATE_PROMPT_3]: generatePrompt3
}

module.exports = {
  types,
  prompts
}

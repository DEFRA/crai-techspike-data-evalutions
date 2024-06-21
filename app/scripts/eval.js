const { loadEvaluator } = require('langchain/evaluation');
const { model, useModel } = require('../llm/ai');

(async () => {
  const chain = await loadEvaluator('labeled_pairwise_string', {
    criteria: 'correctness',
    llm: model('')
  })

  let response1 = "I'm sorry, but there is no specific information provided in the context about the number of NEIRF projects that have been funded. Therefore, I am unable to provide a response to your question."
  let response2 = "The number of NEIRF projects funded is not explicitly stated in the provided document. However, it does mention that a Value for Money analysis is being conducted as part of an evaluation, which includes looking at 29 Round 1 grantees."
  let query = 'How many NEIRF projects have been funded?'
  let referenceOai = 'None'

  const res = await chain.evaluateStringPairs({
    prediction: response1,
    predictionB: response2,
    input: query,
    reference: referenceOai
  })

  console.log(res)
})()

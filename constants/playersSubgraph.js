const axios = require('axios');

async function makeGraphQlQuery(subgraphURL, _ticket, drawStartTime, drawEndTime) {
  const maxPageSize = 100;
  let lastId = '';

  let data;
  const results = [];

  while (true) {
    const queryString = `{
        accounts(first: ${maxPageSize}, where: { id_gt: "${lastId}" }) {
          id
          delegateBalance

          beforeOrAtDrawStartTime: twabs(
            orderBy: timestamp
            orderDirection: desc
            first: 1
            where: { timestamp_lte: ${drawStartTime} }
          ) {
            amount
            timestamp
            delegateBalance
          }

          beforeOrAtDrawEndTime: twabs(
            orderBy: timestamp
            orderDirection: desc
            first: 1
            where: { timestamp_lte: ${drawEndTime} }
          ) {
            amount
            timestamp
            delegateBalance
          }
        }
      }
    `;

    try {
      const response = await axios.post(subgraphURL, { query: queryString });
      data = response.data;
    } catch (error) {
      console.error('GraphQL query error:', error);
      break;
    }

    console.log(data);
    results.push(data.data.accounts);

    const numberOfResults = data.data.accounts.length;
    if (numberOfResults < maxPageSize) {
      // We have retrieved all the results
      break;
    }

    lastId = data.data.accounts[data.data.accounts.length - 1].id;
  }

  return results.flat(1);
}

async function go() {
  let b = await makeGraphQlQuery(
    "https://api.studio.thegraph.com/query/41211/v5-twab-controller-eth-sepolia/v0.0.1",
    "0x690838d786FECb828909d993b0c5fcb8378047DF",
    3586815,
    3580234
  );

  console.log(b);
}

go();

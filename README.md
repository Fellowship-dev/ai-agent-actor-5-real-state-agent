# AI Real State Agent

## Introduction
The **AI Real State Agent** is designed to assist users in finding their perfect home through a simple conversational interface. With this agent, users can input specific criteria for their desired property, such as location and budget, and receive tailored suggestions.

### Key Features
- Chat-based interaction for personalized home searches.
- Integration with OpenAI's advanced models for natural language understanding.
- Supports multiple GPT models based on user preference.
- Uses cache based on input to reduce time and cost of tool usage.
- Leverages LangGraph nodes to perform multiple commands without exceeding the token limit.

### Supported tools by AI Agent
- Explores Apify Datasets using pagination (to avoid excessive token usage)
- Searches the web using Duck Duck Go and scrapes the results for answers
- Searches Zillow using Zip Codes and specific filters
- Queries an external API to list Zip Codes for every US city

## How to Use the AI Real State Agent
1. **Input Instructions**: Provide specific requirements, such as "I want to buy a house with a pool in Miami for less than 1 million dollars."
2. **Bring your own LLM (optional)**: Use your own OpenAI API key from [OpenAI platform](https://platform.openai.com/account/api-keys) and select your preferred GPT model. If left blank, we'll use ours and charge you for token usage.
3. **Receive Results**: The agent will generate a list of suitable properties based on your criteria.

## Pricing Explanation
The AI Real State Agent uses a **PAY PER EVENT** pricing model. Below are some of the key pricing structures:

| Event | Description | Price (USD) |
| --- | --- | --- |
| Actor start per 1 GB | Flat fee for starting an Actor run for each 1 GB of memory.| $0.01 |
| Price per 1000 OpenAI tokens for gpt-4o | Flat fee for every 1000 tokens (input/output) used with gpt-4o.| $0.01 |
| Price per web page scraped | Flat fee for every web page scraped. | $0.01 |
| Price per Duck Duck Go search | Flat fee for every Duck Duck Go search. | $0.01 |
| Price per result when searching Zillow | Flat fee for every result when searching Zillow. | $0.002 |`

## Input Requirements
The following fields are recommeded to start using the AI Real State Agent:

```json
{
  "instructions": "Ask the agent for help to find the perfect home.",
  "openaiApiKey": "YOUR_OPENAI_API_KEY", // optional
  "model": "gpt-4o-mini"
}
```

## AI Agent Flow Chart
![Mermaid Flow Chart](https://github.com/Fellowship-dev/ai-agent-actor-5-real-state-agent/blob/main/mermaid.png?raw=true)

## Expected Output
Upon successful execution, the expected output will resemble the following markdown format:

```
I found several properties in Miami that match your criteria of buying a house with a pool for less than $1 million. Here are the assumptions I made based on your request:

1. You are looking to **buy** a property (as specified).
2. The **maximum price** is set to **$1,000,000** (as specified).
3. The **minimum price** is set to **$1** (as you did not specify).
4. The properties are located in the **ZIP Codes**: 33431, 33131, and 33146.

Here are the top 5 properties I found:

1. **1408 Brickell Bay Dr #1415 & 1416, Miami, FL 33131**
   - **Price:** $700,000
   - **Beds:** 3
   - **Baths:** 3
   - **Area:** 1711 sqft
   - **Details:** [View Listing](https://www.zillow.com/homedetails/1408-Brickell-Bay-Dr-1415-1416-Miami-FL-33131/442183953_zpid/)
   - ![Image](https://photos.zillowstatic.com/fp/a6d02532e56048b53b765e42fafd5ee6-p_e.jpg)

2. **701 Brickell Key Blvd APT 507, Miami, FL 33131**
   - **Price:** $480,000
   - **Beds:** 1
   - **Baths:** 2
   - **Area:** 992 sqft
   - **Details:** [View Listing](https://www.zillow.com/homedetails/701-Brickell-Key-Blvd-APT-507-Miami-FL-33131/70776091_zpid/)
   - ![Image](https://photos.zillowstatic.com/fp/939b6b5b47862d859db20932e146b98d-p_e.jpg)

3. **1430 Brickell Bay Dr APT 504, Miami, FL 33146**
   - **Price:** $475,000
   - **Beds:** 2
   - **Baths:** 2
   - **Area:** 1230 sqft
   - **Details:** [View Listing](https://www.zillow.com/homedetails/1430-Brickell-Bay-Dr-APT-504-Miami-FL-33146/43871277_zpid/)
   - ![Image](https://photos.zillowstatic.com/fp/7d33c68d60fc1dc7f1c6fa242f31df24-p_e.jpg)

4. **485 Brickell Ave APT 4506, Miami, FL 33431**
   - **Price:** $695,000
   - **Beds:** 1
   - **Baths:** 1
   - **Area:** 842 sqft
   - **Details:** [View Listing](https://www.zillow.com/homedetails/485-Brickell-Ave-APT-4506-Miami-FL-33431/92439407_zpid/)
   - ![Image](https://photos.zillowstatic.com/fp/cba657e0760168def02228f5a05c398d-p_e.jpg)

5. **1000 Brickell Plz #4314, Miami, FL 33131**
   - **Price:** $875,000
   - **Beds:** 1
   - **Baths:** 2
   - **Area:** 870 sqft
   - **Details:** [View Listing](https://www.zillow.com/homedetails/1000-Brickell-Plz-4314-Miami-FL-33131/331696313_zpid/)
   - ![Image](https://photos.zillowstatic.com/fp/c4788dc10431e8c1be99fc77b7d54256-p_e.jpg)

### Why I Chose These Properties:
- **Diversity in Size and Price:** The properties range from $480,000 to $875,000, providing options for different budgets while still being under the $1 million cap.
- **Location:** All properties are located in desirable areas of Miami, known for their amenities and lifestyle.
- **Pool Access:** Each property has access to a pool, aligning with your request for a home with this feature.

If you would like more information or to explore other options, feel free to ask!
```

## FAQ
**Q: What is the best way to use the AI Real State Agent?**  
A: Provide clear and specific instructions to get the most relevant results.

**Q: How can I obtain an OpenAI API key?**  
A: You can get your API key from the [OpenAI platform](https://platform.openai.com/account/api-keys).

**Q: Is there a free tier available?**  
A: The model operates on a pay-per-event basis, and charges apply based on the usage.

For further assistance, feel free to reach out to the developer via Apify.

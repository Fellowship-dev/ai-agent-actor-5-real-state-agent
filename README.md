[![Actor AI Real State Agent](https://apify.com/actor-badge?actor=maxfindel/ai-real-state-agent)](https://apify.com/maxfindel/ai-real-state-agent)

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
Sure! I’ve carefully reviewed a total of **600 properties** in Miami that meet your criteria of having a pool and being priced under $1 million. After thorough consideration, I’ve selected the **top 5 properties** that I believe would be great options for you. Here they are:

### 1. 4074 NW 4th St, Miami, FL 33126
- **Price:** $685,000
- **Beds:** 2
- **Baths:** 2
- **Area:** 1,506 sqft
- **Amenities:** Above ground pool
- **Broker:** One Stop Realty
- [View More Information](https://www.zillow.com/homedetails/4074-NW-4th-St-Miami-FL-33126/43843031_zpid/)
![4074 NW 4th St](https://photos.zillowstatic.com/fp/729827e11f99fcf615a5ae1ac54b64e5-p_e.jpg)

### 2. 4001 NW 3rd St, Miami, FL 33126
- **Price:** $820,000
- **Beds:** 2
- **Baths:** 1
- **Area:** 1,908 sqft
- **Broker:** Belhouse Real Estate, LLC
- [View More Information](https://www.zillow.com/homedetails/4001-NW-3rd-St-Miami-FL-33126/43843020_zpid/)
![4001 NW 3rd St](https://photos.zillowstatic.com/fp/100c46f02d0c80d2bd66d95ab34dc6b6-p_e.jpg)

### 3. 4621 NW 4th St, Miami, FL 33126
- **Price:** $699,000
- **Beds:** 5
- **Baths:** 2
- **Area:** 2,157 sqft
- **Broker:** Lifestyle International Realty
- [View More Information](https://www.zillow.com/homedetails/4621-NW-4th-St-Miami-FL-33126/43843819_zpid/)
![4621 NW 4th St](https://photos.zillowstatic.com/fp/24a50d849b5572e3866469eab49d29a0-p_e.jpg)

### 4. 1642 SW 84th Ct, Miami, FL 33155
- **Price:** $995,000
- **Beds:** 4
- **Baths:** 2
- **Area:** 1,890 sqft
- **Amenities:** Big carport
- [View More Information](https://www.zillow.com/homedetails/1642-SW-84th-Ct-Miami-FL-33155/44183450_zpid/)
![1642 SW 84th Ct](https://photos.zillowstatic.com/fp/3b3d652f1d86778418faa0d38edf007c-p_e.jpg)

### 5. 11431 SW 48th St, Miami, FL 33165
- **Price:** $950,000
- **Beds:** 4
- **Baths:** 3
- **Area:** 2,122 sqft
- **Amenities:** Beautiful pool
- **Broker:** Casa Simple LLC
- [View More Information](https://www.zillow.com/homedetails/11431-SW-48th-St-Miami-FL-33165/44200045_zpid/)
![11431 SW 48th St](https://photos.zillowstatic.com/fp/94ad67f6010bcbfbaca74e829608d5c9-p_e.jpg)

---

### Why I Chose These Properties:
- **Diversity in Size and Price:** The selected properties range from 2 to 5 bedrooms and vary in price, ensuring options for different needs and budgets.
- **Pool Availability:** All properties have a pool, which is a key requirement you specified.
- **Location:** These homes are located in various neighborhoods within Miami, providing a good mix of options.

If you have any further questions or would like to schedule a viewing for any of these properties, feel free to reach out!
```

## FAQ
**Q: What is the best way to use the AI Real State Agent?**  
A: Provide clear and specific instructions to get the most relevant results.

**Q: How can I obtain an OpenAI API key?**  
A: You can get your API key from the [OpenAI platform](https://platform.openai.com/account/api-keys).

**Q: Is there a free tier available?**  
A: The model operates on a pay-per-event basis, and charges apply based on the usage.

For further assistance, feel free to reach out to the developer via Apify.

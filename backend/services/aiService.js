const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelsToTry = [
          'gemini-2.5-flash'
        ];
 for (const modelName of modelsToTry) {
          try {
            this.model = this.genAI.getGenerativeModel({ model: modelName });
            console.log(`✅ Using model: ${modelName}`);
            this.isAvailable = true;
            break;
          } catch (modelError) {
            console.log(`❌ Model ${modelName} failed, trying next...`);
          }
        } 
        console.log('✅ Gemini AI service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini AI:', error.message);
        this.isAvailable = false;
      }
    } else {
      console.warn('⚠️ GEMINI_API_KEY not found. AI features will be simulated.');
      this.isAvailable = false;
    }
  }

  // Parse natural language RFP into structured data
  async parseRFPDescription(description) {
    if (!this.isAvailable) {
      return this.simulateRFPParse(description);
    }

    const prompt = `
      You are an AI assistant that helps parse procurement requests into structured data.
      Extract structured procurement information from the following RFP description.
      
      Return ONLY a valid JSON object with this exact structure:
      {
        "items": [
          {
            "name": "string (item name)",
            "quantity": "number (quantity required)",
            "specifications": "string (technical specifications)",
            "unitPrice": "number or null (price per unit if mentioned)",
            "totalPrice": "number or null (total price for this item if mentioned)"
          }
        ],
        "totalBudget": "number (total budget mentioned)",
        "currency": "string (USD, INR, EUR, etc. Default: USD)",
        "deliveryDate": "string (YYYY-MM-DD format or null)",
        "deliveryDays": "number (number of days for delivery)",
        "paymentTerms": "string (payment terms like Net 30, Net 45, etc.)",
        "warranty": "string (warranty period mentioned)",
        "specialRequirements": "string (any special requirements)"
      }
      
      RFP Description: "${description}"
      
      Instructions:
      1. Extract all items mentioned in the description
      2. If quantities are not specified, assume 1
      3. If currency is not mentioned, use "USD"
      4. Extract delivery timeframe and convert to days if needed
      5. If warranty is not mentioned, use "1 year"
      6. If payment terms are not mentioned, use "Net 30"
      7. For prices, extract numbers only (remove currency symbols)
      
      Return ONLY the JSON object, no additional text.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                       text.match(/```\n([\s\S]*?)\n```/) ||
                       text.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        // Remove markdown code blocks
        jsonStr = jsonStr.replace(/```json\n|```\n|```/g, '');
        
        try {
          const parsedData = JSON.parse(jsonStr);
          console.log('✅ Successfully parsed RFP with AI');
          return parsedData;
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError);
          console.log('Raw response:', text);
          return this.simulateRFPParse(description);
        }
      } else {
        console.error('No JSON found in AI response');
        return this.simulateRFPParse(description);
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error.message);
      console.log('Falling back to simulation mode');
      return this.simulateRFPParse(description);
    }
  }

  // Parse vendor response email
  async parseVendorResponse(emailContent, rfpData) {
    if (!this.isAvailable) {
      return this.simulateVendorParse(emailContent, rfpData);
    }

    const prompt = `
      Parse this vendor proposal email and extract structured information.
      Compare it with the original RFP requirements and provide analysis.
      
      Original RFP Requirements:
      ${JSON.stringify(rfpData.structuredData || {}, null, 2)}
      
      Vendor Email:
      Subject: ${emailContent.subject}
      Body: ${emailContent.body}
      
      Return ONLY a valid JSON object with this structure:
      {
        "proposalData": {
          "items": [
            {
              "name": "string",
              "quantity": "number",
              "specifications": "string",
              "unitPrice": "number",
              "totalPrice": "number"
            }
          ],
          "totalPrice": "number",
          "currency": "string",
          "deliveryDate": "string (YYYY-MM-DD)",
          "deliveryDays": "number",
          "paymentTerms": "string",
          "warranty": "string",
          "notes": "string"
        },
        "analysis": {
          "completenessScore": "number (0-100, how complete is the response)",
          "priceScore": "number (0-100, lower is better price)",
          "deliveryScore": "number (0-100, faster delivery = higher score)",
          "termsScore": "number (0-100, favorable terms = higher score)",
          "totalScore": "number (0-100, weighted average)",
          "summary": "string (brief summary of proposal)",
          "strengths": ["string array (key strengths)"],
          "weaknesses": ["string array (areas for improvement)"],
          "recommendation": "string (high/medium/low)"
        }
      }
      
      Scoring Guidelines:
      1. completenessScore: Check if all RFP items are addressed
      2. priceScore: Compare with RFP budget (lower price = higher score)
      3. deliveryScore: Compare with RFP delivery requirements
      4. termsScore: Evaluate payment terms and warranty
      5. totalScore: Average of above scores
      6. recommendation: high (score > 80), medium (50-80), low (< 50)
      
      Return ONLY the JSON object, no additional text.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                       text.match(/```\n([\s\S]*?)\n```/) ||
                       text.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        jsonStr = jsonStr.replace(/```json\n|```\n|```/g, '');
        
        try {
          const parsedData = JSON.parse(jsonStr);
          console.log('✅ Successfully parsed vendor response with AI');
          return parsedData;
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError);
          return this.simulateVendorParse(emailContent, rfpData);
        }
      } else {
        return this.simulateVendorParse(emailContent, rfpData);
      }
    } catch (error) {
      console.error('Error parsing vendor response:', error.message);
      return this.simulateVendorParse(emailContent, rfpData);
    }
  }

  // Compare multiple proposals
  async compareProposals(proposals, rfpData) {
    if (!this.isAvailable) {
      return this.simulateProposalComparison(proposals, rfpData);
    }

    const prompt = `
      Compare these vendor proposals and provide a comprehensive analysis.
      
      Original RFP:
      - Budget: ${rfpData.structuredData?.totalBudget || 'Not specified'} ${rfpData.structuredData?.currency || 'USD'}
      - Delivery Requirement: ${rfpData.structuredData?.deliveryDays || 'Not specified'} days
      - Requirements: ${rfpData.description.substring(0, 500)}...
      
      Proposals to compare:
      ${proposals.map((p, i) => `
      Proposal ${i + 1} (Vendor: ${p.vendorName || 'Unknown'}):
      - Total Price: ${p.structuredData?.totalPrice || 'Not specified'} ${p.structuredData?.currency || 'USD'}
      - Delivery: ${p.structuredData?.deliveryDays || 'Not specified'} days
      - Payment Terms: ${p.structuredData?.paymentTerms || 'Not specified'}
      - Warranty: ${p.structuredData?.warranty || 'Not specified'}
      ${p.aiAnalysis ? `- AI Analysis Score: ${p.aiAnalysis.totalScore || 0}/100` : ''}
      `).join('\n')}
      
      Return ONLY a valid JSON object with:
      {
        "comparison": [
          {
            "vendorId": "string",
            "vendorName": "string",
            "totalScore": "number (0-100)",
            "priceRank": "number (1 = best price, higher = worse)",
            "deliveryRank": "number (1 = fastest delivery)",
            "valueForMoney": "number (0-100, combination of price and quality)",
            "summary": "string (brief analysis of this vendor)",
            "recommendation": "string (high/medium/low)"
          }
        ],
        "recommendation": {
          "bestVendorId": "string (ID of recommended vendor)",
          "bestVendorName": "string (name of recommended vendor)",
          "reason": "string (detailed reasoning)",
          "confidence": "number (0-100, confidence in recommendation)"
        },
        "insights": [
          "string (key insights from comparison)",
          "string (another insight)",
          "string (another insight)"
        ]
      }
      
      Analysis Guidelines:
      1. Compare prices relative to RFP budget
      2. Compare delivery times against requirements
      3. Evaluate terms and conditions
      4. Consider completeness of response
      5. Calculate value for money
      6. Rank vendors for price and delivery
      
      Return ONLY the JSON object, no additional text.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                       text.match(/```\n([\s\S]*?)\n```/) ||
                       text.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        jsonStr = jsonStr.replace(/```json\n|```\n|```/g, '');
        
        try {
          const parsedData = JSON.parse(jsonStr);
          console.log('✅ Successfully compared proposals with AI');
          return parsedData;
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError);
          return this.simulateProposalComparison(proposals, rfpData);
        }
      } else {
        return this.simulateProposalComparison(proposals, rfpData);
      }
    } catch (error) {
      console.error('Error comparing proposals:', error.message);
      return this.simulateProposalComparison(proposals, rfpData);
    }
  }

  // Simulation methods for when AI is not available
  simulateRFPParse(description) {
    console.log('🤖 Simulating RFP parsing');
    
    // Extract numbers from description
    const budgetMatch = description.match(/\$?(\d+[\d,]*\.?\d*)\s*(thousand|hundred|k|K|m|M)?/i);
    const totalBudget = budgetMatch ? parseFloat(budgetMatch[1].replace(/,/g, '')) * 
      (budgetMatch[2] && budgetMatch[2].toLowerCase() === 'k' ? 1000 : 1) : 50000;
    
    const deliveryMatch = description.match(/(\d+)\s*(days?|weeks?|months?)/i);
    const deliveryDays = deliveryMatch ? 
      (deliveryMatch[2].toLowerCase().includes('week') ? parseInt(deliveryMatch[1]) * 7 :
       deliveryMatch[2].toLowerCase().includes('month') ? parseInt(deliveryMatch[1]) * 30 :
       parseInt(deliveryMatch[1])) : 30;
    
    // Extract items
    const items = [];
    const itemMatches = description.match(/(\d+)\s*(laptops?|monitors?|computers?|screens?)/gi) || [];
    
    itemMatches.forEach(match => {
      const matchResult = match.match(/(\d+)\s*(.+)/i);
      if (matchResult) {
        items.push({
          name: matchResult[2].trim(),
          quantity: parseInt(matchResult[1]),
          specifications: 'Standard specifications',
          unitPrice: null,
          totalPrice: null
        });
      }
    });
    
    if (items.length === 0) {
      items.push({
        name: 'Procurement Items',
        quantity: 1,
        specifications: 'As described in requirements',
        unitPrice: null,
        totalPrice: null
      });
    }
    
    return {
      items,
      totalBudget: totalBudget || 50000,
      currency: 'USD',
      deliveryDate: null,
      deliveryDays: deliveryDays || 30,
      paymentTerms: 'Net 30',
      warranty: '1 year',
      specialRequirements: 'Please provide detailed specifications and pricing'
    };
  }

  simulateVendorParse(emailContent, rfpData) {
    console.log('🤖 Simulating vendor response parsing');
    
    // Extract price from email
    const priceMatch = emailContent.body.match(/\$?(\d+[\d,]*\.?\d*)/g);
    const totalPrice = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 
      (rfpData.structuredData?.totalBudget || 50000) * 0.9;
    
    return {
      proposalData: {
        items: rfpData.structuredData?.items?.map(item => ({
          ...item,
          unitPrice: totalPrice / (rfpData.structuredData?.items?.length || 1) / (item.quantity || 1),
          totalPrice: totalPrice / (rfpData.structuredData?.items?.length || 1)
        })) || [{
          name: 'Complete Solution',
          quantity: 1,
          specifications: 'As per RFP requirements',
          unitPrice: totalPrice,
          totalPrice: totalPrice
        }],
        totalPrice: totalPrice,
        currency: rfpData.structuredData?.currency || 'USD',
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryDays: rfpData.structuredData?.deliveryDays ? 
          Math.max(1, rfpData.structuredData.deliveryDays - 5) : 25,
        paymentTerms: 'Net 45',
        warranty: '2 years',
        notes: 'We are excited to work with you on this project.'
      },
      analysis: {
        completenessScore: 85,
        priceScore: 75,
        deliveryScore: 90,
        termsScore: 80,
        totalScore: 82.5,
        summary: 'Competitive proposal with good terms and fast delivery.',
        strengths: ['Competitive pricing', 'Fast delivery', 'Extended warranty'],
        weaknesses: ['Payment terms slightly longer than requested'],
        recommendation: 'high'
      }
    };
  }

  simulateProposalComparison(proposals, rfpData) {
    console.log('🤖 Simulating proposal comparison');
    
    const comparison = proposals.map((p, index) => ({
      vendorId: p.vendorId || `vendor-${index}`,
      vendorName: p.vendorName || `Vendor ${index + 1}`,
      totalScore: p.aiAnalysis?.totalScore || Math.floor(Math.random() * 30) + 60,
      priceRank: index + 1,
      deliveryRank: index + 1,
      valueForMoney: p.aiAnalysis?.totalScore || Math.floor(Math.random() * 30) + 60,
      summary: `Proposal from ${p.vendorName || `Vendor ${index + 1}`} with competitive pricing.`,
      recommendation: index === 0 ? 'high' : index === 1 ? 'medium' : 'low'
    }));
    
    // Sort by score descending
    comparison.sort((a, b) => b.totalScore - a.totalScore);
    
    // Assign correct ranks after sorting
    comparison.forEach((vendor, index) => {
      vendor.priceRank = index + 1;
      vendor.deliveryRank = index + 1;
    });
    
    return {
      comparison,
      recommendation: {
        bestVendorId: comparison[0]?.vendorId || '',
        bestVendorName: comparison[0]?.vendorName || 'No vendor',
        reason: `Best overall score (${comparison[0]?.totalScore || 0}/100) with good value for money.`,
        confidence: comparison[0]?.totalScore || 75
      },
      insights: [
        'All vendors provided competitive pricing.',
        'Delivery times are within acceptable range.',
        'Consider negotiating payment terms for better value.',
        'Vendor reputation and support should also be considered.'
      ]
    };
  }
}

module.exports = new AIService();
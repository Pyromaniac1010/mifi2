export const PERSONALITIES = {
  genZ: { name: 'Gen Z Friend', emoji: '😎', color: 'from-purple-600 to-pink-600' },
  coolUncle: { name: 'Cool Uncle', emoji: '🤙', color: 'from-blue-600 to-cyan-600' },
  harsh: { name: 'Harsh Coach', emoji: '💪', color: 'from-red-600 to-orange-600' },
  professional: { name: 'Professional Advisor', emoji: '💼', color: 'from-gray-700 to-gray-900' },
};

export function getMiInsight(income, expenses, debts, personality) {
  const totalDebt = debts.reduce((s, d) => s + d.principal, 0);

  if (expenses > income) {
    return {
      genZ: "Bestie… we need to talk about these expenses 😬 You're spending more than you're making and that's giving broke-era vibes. Let's fix this ASAP!",
      coolUncle: "Hey kiddo, slight problem — you're spending more than you're earning this month. Let's chat about getting that back on track, yeah?",
      harsh: 'You\'re BLEEDING money! Expenses exceed income. This is exactly why you\'re not winning. FIX. THIS. NOW. 🔥',
      professional: 'Alert: current expenditure exceeds income. Immediate budget review is recommended to prevent financial deterioration.',
    }[personality];
  }

  if (income > 0 && totalDebt > income * 3) {
    return {
      genZ: `Your debt is lowkey wild rn ($${totalDebt.toFixed(0)}) 😳 But don't stress — we've got a plan. Tackle the highest-interest debt first and you'll be debt-free before you know it! 💪`,
      coolUncle: `That debt load is looking a bit heavy, champ ($${totalDebt.toFixed(0)}). But hey, we've seen worse! Let's make a solid plan to knock it down. You've got this. 🎯`,
      harsh: `$${totalDebt.toFixed(0)} in debt?! UNACCEPTABLE! Every day you wait is money down the drain. Attack it NOW. 💪🔥`,
      professional: `Debt-to-income analysis indicates an elevated risk level ($${totalDebt.toFixed(0)} outstanding). An aggressive debt-reduction protocol is advised.`,
    }[personality];
  }

  return {
    genZ: 'Looking pretty solid this month! Keep it up, bestie 💸 Remember — passive income is the real flex, so keep building it! ✨',
    coolUncle: "Nice work this month, kiddo! You're making good moves. Keep it up — and don't forget to treat yourself occasionally. Balance matters. 🌟",
    harsh: "Not terrible, but don't get comfortable. You should be doing BETTER. Push harder, earn more, waste less. MAXIMIZE EVERYTHING! 💪",
    professional: 'Current financial metrics are within acceptable parameters. Continue the disciplined approach and look for optimization opportunities.',
  }[personality];
}

export function generateMiResponse(question, data, personality) {
  const { totalIncome, totalExpenses, passiveIncome, debts } = data;
  const netBalance = totalIncome - totalExpenses;
  const totalDebt = debts.reduce((s, d) => s + d.principal, 0);
  const debtPayment = debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const obligations = totalExpenses + debtPayment;
  const solvency = obligations > 0 ? (passiveIncome / obligations) * 100 : 0;
  const q = question.toLowerCase();

  if (q.includes('how am i doing') || (q.includes('financ') && q.includes('status')) || q.includes('how are my')) {
    if (netBalance >= 0) {
      return {
        genZ: `Okay so like… you're actually doing pretty good rn! 💸 You're making $${totalIncome.toFixed(0)} and spending $${totalExpenses.toFixed(0)}, so you're up by $${netBalance.toFixed(0)}. That's lowkey fire ngl. Real talk though — passive income only covers about ${solvency.toFixed(0)}% of your obligations, so you're still leaning hard on that 9-5. Time to build those side hustles fr 📈`,
        coolUncle: `Hey kiddo! Not bad at all. You're bringing in $${totalIncome.toFixed(0)} and keeping expenses at $${totalExpenses.toFixed(0)} — a $${netBalance.toFixed(0)} surplus. Proud of you! 🎉 Here's the thing: you're still trading time for most of that money. Let's build some passive income so you've got more freedom.`,
        harsh: `Finally, something decent. You're $${netBalance.toFixed(0)} positive. Don't get comfortable though — passive income only covers ${solvency.toFixed(0)}% of your obligations. You should be at 100%+ by now. Stop celebrating mediocrity and MULTIPLY that passive income. 💪🔥`,
        professional: `You're operating with a surplus of $${netBalance.toFixed(0)} this month (income $${totalIncome.toFixed(0)}, expenses $${totalExpenses.toFixed(0)}). Your solvency ratio is ${solvency.toFixed(1)}%, indicating meaningful dependence on active income. I recommend directing surplus toward passive-income development.`,
      }[personality];
    }
    return {
      genZ: `Oof bestie… not gonna sugarcoat it 😬 You're spending $${Math.abs(netBalance).toFixed(0)} more than you're making. That's broke-era energy and we need to fix it ASAP. Trim some expenses or stack more income. You got this! 💪`,
      coolUncle: `Alright, real talk, champ — you're in the red by $${Math.abs(netBalance).toFixed(0)} this month. Not sustainable, but fixable. Tighten the belt a little and maybe pick up a side gig. Broke is temporary; good habits last. Let's turn it around!`,
      harsh: `Are you SERIOUS right now?! You're BLEEDING $${Math.abs(netBalance).toFixed(0)} this month! Cut the excuses, cut the expenses, and get it together. Every wasted dollar could've been working for you. DO BETTER. 😤`,
      professional: `Your current trajectory is unsustainable — a deficit of $${Math.abs(netBalance).toFixed(0)}. Immediate actions: (1) audit and reduce expenses, (2) diversify income, (3) establish an emergency buffer. Disciplined correction is required.`,
    }[personality];
  }

  if (q.includes('debt') || q.includes('saving')) {
    if (totalDebt > 0) {
      return {
        genZ: `So you've got $${totalDebt.toFixed(0)} in debt… honestly? Kill that first, bestie 🎯 High-interest debt is literally stealing your future bag. Pay minimums on everything except the highest-interest one, then attack that like your life depends on it. Then we stack savings. Trust the process 💯`,
        coolUncle: `Here's the wisdom I wish someone gave me younger, kiddo: that $${totalDebt.toFixed(0)} is working against you every day. Crush it using the avalanche method — highest interest first. Savings matter, but debt's the emergency. Kill it, then build wealth. 🙌`,
        harsh: `Why is this even a question?! $${totalDebt.toFixed(0)} in DEBT! Forget savings — ATTACK that debt like your freedom depends on it, because it does. Highest interest first. No excuses. Execute. 💪🔥`,
        professional: `You're carrying $${totalDebt.toFixed(0)} in debt. Prioritize elimination via the avalanche method (highest APR first) while maintaining minimums elsewhere. Compound interest works against you in debt and for you in investments — clear the liability first.`,
      }[personality];
    }
    return {
      genZ: `Yooo you're debt-free?! That's goated 🔥 Now build that emergency fund (3–6 months of expenses), then start investing in stuff that pays you while you sleep — index funds, dividends, maybe that side business. Let's get this bread 💰`,
      coolUncle: `No debt? That's what I like to see! 🎉 You're ahead of most people. Build a 3–6 month safety net, then invest steadily. Consistency beats timing — even small amounts compound. Proud of you, champ!`,
      harsh: `No debt? Good. Now STOP sitting on cash — build a 6-month buffer, then invest aggressively. Idle money loses to inflation. Index funds, dividends, real estate. Make your money WORK. 📈`,
      professional: `Debt-free status confirmed — an excellent position. Next: (1) establish a 3–6 month emergency fund, (2) maximize tax-advantaged retirement accounts, (3) build a diversified index portfolio. Time in market beats timing the market.`,
    }[personality];
  }

  if (q.includes('passive') || q.includes('side hustle') || q.includes('side income')) {
    return {
      genZ: `Passive income? Now we're talking 🚀 Start where you are: skills → freelance on Fiverr/Upwork, then systematize. Or build digital products — courses, templates, ebooks. Content on YouTube/TikTok that pays forever. Dividend stocks too. The goal: money while you're at brunch 💸`,
      coolUncle: `The golden question, kiddo! Passive income buys back your time. Start with what you know — turn a skill into a course or product. Got some cash? Dividend payers. Feeling bold? Real-estate crowdfunding. Start small, learn, scale. 🏗️`,
      harsh: `FINALLY thinking like a winner 💪 Stop trading hours for dollars. Skills? Monetize them — courses, consulting, products. Money? Invest it — dividends, index funds, REITs. Time? Build assets — a channel, an app, a SaaS. "I don't know how" isn't an excuse. LEARN. MOVE. 🔥`,
      professional: `Passive-income options, ranked by accessibility: (1) dividend-growth investing — stable and predictable; (2) digital products — leverages existing expertise; (3) REITs — diversification; (4) automated online businesses — higher risk/return. Allocate 20–30% of monthly surplus; compounding becomes significant at the 24–36 month mark.`,
    }[personality];
  }

  return {
    genZ: "Hmm didn't quite catch that, bestie! Ask me about your finances, debt strategy, or how to stack passive income. I'm here to help you secure the bag 💰✨",
    coolUncle: "Not quite sure what you're after, champ. Hit me with questions about your money, debt plans, or building wealth. Uncle Mi's got you 🤙",
    harsh: 'Be specific! Ask me about your finances, your debt, your income strategy. Stop wasting time with vague questions and GET TO THE POINT. 💪',
    professional: "I'm not certain I understood. Try asking about your financial status, debt strategy, expense optimization, or passive-income development.",
  }[personality];
}

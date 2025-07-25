// Retirement Calculator JavaScript

class RetirementCalculator {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const calculateBtn = document.getElementById('calculate-btn');
        calculateBtn.addEventListener('click', () => this.calculate());

        // Auto-calculate on input change with debouncing
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', this.debounce(() => this.calculate(), 500));
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    getFormData() {
        const form = document.getElementById('retirement-form');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = parseFloat(value) || 0;
        }
        
        return data;
    }



    calculate() {
        const data = this.getFormData();
        
        // Validate required fields
        if (!this.validateInputs(data)) {
            return;
        }

        const results = this.performCalculations(data);
        
        // Store results and input data in localStorage for results page
        localStorage.setItem('retirementResults', JSON.stringify(results));
        localStorage.setItem('retirementInputData', JSON.stringify(data));
        
        // Navigate to results page
        window.location.href = 'results.html';
    }

    validateInputs(data) {
        const required = ['currentAge', 'retirementAge', 'lifeExpectancy', 'annualIncome'];
        for (let field of required) {
            if (!data[field] || data[field] <= 0) {
                alert(`Please enter a valid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }
        
        if (data.currentAge >= data.retirementAge) {
            alert('Retirement age must be greater than current age');
            return false;
        }
        
        if (data.retirementAge >= data.lifeExpectancy) {
            alert('Life expectancy must be greater than retirement age');
            return false;
        }
        
        return true;
    }

    performCalculations(data) {
        const yearsToRetirement = data.retirementAge - data.currentAge;
        const yearsInRetirement = data.lifeExpectancy - data.retirementAge;
        
        // Calculate current total retirement savings
        const currentTotalSavings = (data.current401k || 0) + (data.currentIRA || 0) + (data.currentHSA || 0);
        
        // Calculate total monthly retirement contributions
        const monthly401k = data.monthly401kContribution || 0;
        const monthlyIRA = data.monthlyIRAContribution || 0;
        const monthlyHSA = data.monthlyHSAContribution || 0;
        const monthlyRetirementContributions = monthly401k + monthlyIRA + monthlyHSA;
        
        // Calculate employer match (only on 401k)
        const employerMatch = monthly401k * (data.employerMatch / 100);
        const totalMonthlyContribution = monthlyRetirementContributions + employerMatch;
        
        // Calculate combined household income (including spouse and bonuses)
        const spouseAnnualIncome = data.spouseIncome || 0;
        const annualBonus = data.annualBonus || 0;
        const totalHouseholdIncome = data.annualIncome + spouseAnnualIncome + annualBonus;
        
        // Calculate monthly income needed (adjusted for cost of living change and additional expenses)
        const baseMonthlyNeeded = data.desiredMonthlyIncome || 
            (totalHouseholdIncome * (data.incomeReplacement / 100)) / 12;
        
        // Adjust for cost of living change in retirement
        const costOfLivingAdjustment = 1 + ((data.retirementLocation || 0) / 100);
        const adjustedMonthlyNeeded = baseMonthlyNeeded * costOfLivingAdjustment;
        
        // Add additional retirement expenses
        const additionalExpenses = (data.healthcareCosts || 0) + 
                                 (data.ltcInsurance || 0) + 
                                 (data.childrenSupport || 0) + 
                                 ((data.travelBudget || 0) / 12);
        
        const monthlyIncomeNeeded = adjustedMonthlyNeeded + additionalExpenses;
        
        // Account for mortgage payoff during retirement planning
        const mortgagePayoffAge = data.currentAge + (data.mortgageYearsLeft || 0);
        const mortgagePaymentDuringRetirement = (mortgagePayoffAge > data.retirementAge) ? 
            (data.mortgagePayment || 0) : 0;
        
        const adjustedMonthlyIncomeNeeded = monthlyIncomeNeeded + mortgagePaymentDuringRetirement;
        
        // Calculate savings growth with annual salary increases
        const monthlyReturnRate = (data.preRetirementReturn / 100) / 12;
        const annualRaiseRate = (data.annualRaise || 0) / 100;
        
        // Enhanced future value calculation with growing contributions
        let futureValue401k = data.current401k || 0;
        let futureValueIRA = data.currentIRA || 0;
        let futureValueHSA = data.currentHSA || 0;
        let totalContributions = 0;
        
        // Year-by-year calculation with salary increases
        for (let year = 1; year <= yearsToRetirement; year++) {
            // Apply growth to existing balances
            futureValue401k *= (1 + (data.preRetirementReturn / 100));
            futureValueIRA *= (1 + (data.preRetirementReturn / 100));
            futureValueHSA *= (1 + (data.preRetirementReturn / 100));
            
            // Calculate contributions for this year (with salary increases)
            const salaryGrowthFactor = Math.pow(1 + annualRaiseRate, year - 1);
            const annual401kContribution = monthly401k * 12 * salaryGrowthFactor;
            const annualIRAContribution = monthlyIRA * 12;
            const annualHSAContribution = monthlyHSA * 12;
            const annualEmployerMatch = annual401kContribution * (data.employerMatch / 100);
            
            // Add contributions
            futureValue401k += (annual401kContribution + annualEmployerMatch);
            futureValueIRA += annualIRAContribution;
            futureValueHSA += annualHSAContribution;
            
            totalContributions += annual401kContribution + annualIRAContribution + 
                                annualHSAContribution + annualEmployerMatch;
        }
        
        // Future value of other investments
        const futureValueOtherInvestments = (data.otherInvestments || 0) * 
            Math.pow(1 + (data.preRetirementReturn / 100), yearsToRetirement);
        
        // Total at retirement
        const totalAtRetirement = futureValue401k + futureValueIRA + futureValueHSA + futureValueOtherInvestments;
        
        // Calculate total Social Security (including spouse)
        const totalSocialSecurity = (data.socialSecurity || 0) + (data.spouseSocialSecurity || 0);
        
        // Calculate retirement income sources
        const monthlyIncomeFromPortfolio = totalAtRetirement * (data.postRetirementReturn / 100) / 12;
        const partTimeIncome = data.partTimeIncome || 0; // Early retirement income
        const totalMonthlyIncome = monthlyIncomeFromPortfolio + totalSocialSecurity + 
                                 (data.pension || 0) + (data.otherIncome || 0) + partTimeIncome;
        
        // Income gap calculation
        const incomeGap = adjustedMonthlyIncomeNeeded - totalMonthlyIncome;
        
        // Calculate how long money will last with enhanced withdrawal logic
        const monthlyWithdrawalNeeded = Math.max(0, adjustedMonthlyIncomeNeeded - 
            (totalSocialSecurity + (data.pension || 0) + (data.otherIncome || 0) + partTimeIncome));
        
        const postRetirementMonthlyReturn = (data.postRetirementReturn / 100) / 12;
        
        let monthsMoneyLasts = 0;
        if (monthlyWithdrawalNeeded > 0 && postRetirementMonthlyReturn > 0) {
            monthsMoneyLasts = -Math.log(1 - (totalAtRetirement * postRetirementMonthlyReturn) / 
                monthlyWithdrawalNeeded) / Math.log(1 + postRetirementMonthlyReturn);
        } else if (monthlyWithdrawalNeeded <= 0) {
            monthsMoneyLasts = yearsInRetirement * 12;
        } else {
            monthsMoneyLasts = totalAtRetirement / monthlyWithdrawalNeeded;
        }
        
        const ageWhenMoneyRunsOut = data.retirementAge + (monthsMoneyLasts / 12);
        
        // Calculate real purchasing power (inflation adjusted)
        const inflationFactor = Math.pow(1 + (data.inflationRate / 100), yearsToRetirement);
        const realPurchasingPower = totalAtRetirement / inflationFactor;
        
        // Calculate investment growth
        const initialInvestments = currentTotalSavings + (data.otherInvestments || 0);
        const investmentGrowth = totalAtRetirement - initialInvestments - totalContributions;
        
        // Generate enhanced yearly projection
        const yearlyProjection = this.generateEnhancedYearlyProjection(data, yearsToRetirement);
        
        return {
            totalAtRetirement,
            monthlyIncomeNeeded: adjustedMonthlyIncomeNeeded,
            totalMonthlyIncome,
            monthlyIncomeFromPortfolio,
            incomeGap,
            ageWhenMoneyRunsOut,
            yearsToRetirement,
            totalContributions,
            investmentGrowth,
            realPurchasingPower,
            yearlyProjection,
            monthlyWithdrawalNeeded,
            futureValue401k,
            futureValueIRA,
            futureValueHSA,
            futureValueOtherInvestments,
            totalSocialSecurity,
            currentTotalSavings,
            totalHouseholdIncome
        };
    }

    generateEnhancedYearlyProjection(data, yearsToRetirement) {
        const projection = [];
        
        // Starting balances
        let balance401k = data.current401k || 0;
        let balanceIRA = data.currentIRA || 0;
        let balanceHSA = data.currentHSA || 0;
        let balanceOther = data.otherInvestments || 0;
        
        const annual401k = (data.monthly401kContribution || 0) * 12;
        const annualIRA = (data.monthlyIRAContribution || 0) * 12;
        const annualHSA = (data.monthlyHSAContribution || 0) * 12;
        const annualReturn = data.preRetirementReturn / 100;
        const salaryGrowthRate = (data.annualRaise || 0) / 100;
        const employerMatchRate = (data.employerMatch || 0) / 100;
        
        let totalContributions = 0;
        let totalEmployerMatch = 0;
        
        for (let year = 0; year <= yearsToRetirement; year++) {
            const age = data.currentAge + year;
            
            if (year > 0) {
                // Apply growth to all accounts
                balance401k *= (1 + annualReturn);
                balanceIRA *= (1 + annualReturn);
                balanceHSA *= (1 + annualReturn);
                balanceOther *= (1 + annualReturn);
                
                // Calculate contributions with salary growth (401k only grows with salary)
                const salaryGrowthFactor = Math.pow(1 + salaryGrowthRate, year - 1);
                const adjusted401kContribution = annual401k * salaryGrowthFactor;
                const employerMatch = adjusted401kContribution * employerMatchRate;
                
                // Add contributions
                balance401k += adjusted401kContribution + employerMatch;
                balanceIRA += annualIRA;
                balanceHSA += annualHSA;
                
                totalContributions += adjusted401kContribution + annualIRA + annualHSA;
                totalEmployerMatch += employerMatch;
            }
            
            const totalBalance = balance401k + balanceIRA + balanceHSA + balanceOther;
            const totalGrowth = totalBalance - (data.current401k || 0) - (data.currentIRA || 0) - 
                              (data.currentHSA || 0) - (data.otherInvestments || 0) - 
                              totalContributions - totalEmployerMatch;
            
            projection.push({
                year: year,
                age: age,
                balance: totalBalance,
                balance401k: balance401k,
                balanceIRA: balanceIRA,
                balanceHSA: balanceHSA,
                balanceOther: balanceOther,
                contributions: totalContributions,
                employerMatch: totalEmployerMatch,
                growth: totalGrowth
            });
        }
        
        return projection;
    }

        // Methods removed - handled by results page

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RetirementCalculator();
});

// Additional utility functions for enhanced user experience
function updateIncomeReplacement() {
    const incomeReplacement = document.getElementById('income-replacement');
    const annualIncome = document.getElementById('annual-income');
    const desiredMonthlyIncome = document.getElementById('desired-monthly-income');
    
    if (incomeReplacement && annualIncome && desiredMonthlyIncome) {
        const percentage = parseFloat(incomeReplacement.value) || 80;
        const income = parseFloat(annualIncome.value) || 75000;
        const monthlyAmount = (income * (percentage / 100)) / 12;
        desiredMonthlyIncome.value = Math.round(monthlyAmount);
    }
}

// Add event listeners for dynamic updates
document.addEventListener('DOMContentLoaded', () => {
    const incomeReplacement = document.getElementById('income-replacement');
    const annualIncome = document.getElementById('annual-income');
    
    if (incomeReplacement) {
        incomeReplacement.addEventListener('input', updateIncomeReplacement);
    }
    
    if (annualIncome) {
        annualIncome.addEventListener('input', updateIncomeReplacement);
    }
    
    // Initial update
    updateIncomeReplacement();
}); 
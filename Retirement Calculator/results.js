// Results Page JavaScript for PayPal Retirement Calculator

class RetirementResults {
    constructor() {
        this.charts = {};
        this.results = null;
        this.inputData = null;
        
        this.initializeTabNavigation();
        this.loadResults();
        this.populateAllTabs();
    }

    initializeTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked button and corresponding panel
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                
                // Refresh charts when switching to projections tab
                if (targetTab === 'projections') {
                    setTimeout(() => this.refreshCharts(), 100);
                }
            });
        });
    }

    loadResults() {
        // Get calculation results from localStorage
        const storedResults = localStorage.getItem('retirementResults');
        const storedInputData = localStorage.getItem('retirementInputData');
        
        if (storedResults && storedInputData) {
            this.results = JSON.parse(storedResults);
            this.inputData = JSON.parse(storedInputData);
        } else {
            // Redirect back to calculator if no data
            window.location.href = 'index.html';
            return;
        }
    }

    populateAllTabs() {
        this.populateOverviewTab();
        this.populateProjectionsTab();
        this.populateAccountsTab();
        this.populateAnalysisTab();
        this.populateRecommendationsTab();
    }

    populateOverviewTab() {
        // Update summary cards
        document.getElementById('total-at-retirement').textContent = 
            this.formatCurrency(this.results.totalAtRetirement);
        document.getElementById('monthly-income-available').textContent = 
            this.formatCurrency(this.results.totalMonthlyIncome);
        document.getElementById('income-gap').textContent = 
            this.formatCurrency(Math.abs(this.results.incomeGap));
        document.getElementById('money-lasts-until').textContent = 
            `Age ${Math.floor(this.results.ageWhenMoneyRunsOut)}`;

        // Update overview metrics
        document.getElementById('years-to-retirement').textContent = this.results.yearsToRetirement;
        document.getElementById('household-income').textContent = 
            this.formatCurrency(this.results.totalHouseholdIncome);
        
        // Calculate and display savings rate
        const totalMonthlyContributions = (this.inputData.monthly401kContribution || 0) + 
                                        (this.inputData.monthlyIRAContribution || 0) + 
                                        (this.inputData.monthlyHSAContribution || 0);
        const savingsRate = (totalMonthlyContributions * 12) / this.results.totalHouseholdIncome * 100;
        document.getElementById('savings-rate').textContent = `${savingsRate.toFixed(1)}%`;

        // Emergency fund status
        const monthlyExpenses = (this.results.totalHouseholdIncome / 12) + 
                              (this.inputData.mortgagePayment || 0) + (this.inputData.otherDebt || 0);
        const recommendedEmergencyFund = monthlyExpenses * 6;
        const emergencyFundRatio = (this.inputData.emergencyFund || 0) / recommendedEmergencyFund;
        const emergencyStatus = emergencyFundRatio >= 1 ? 'Adequate' : 
                               emergencyFundRatio >= 0.5 ? 'Partial' : 'Insufficient';
        document.getElementById('emergency-fund-status').textContent = 
            `${this.formatCurrency(this.inputData.emergencyFund || 0)} (${emergencyStatus})`;

        // Update card colors based on results
        this.updateCardColors();
    }

    populateProjectionsTab() {
        // Generate charts
        this.generateSavingsChart();
        this.generateIncomeChart();

        // Update projection summary
        document.getElementById('investment-growth').textContent = 
            this.formatCurrency(this.results.investmentGrowth);
        document.getElementById('total-contributions').textContent = 
            this.formatCurrency(this.results.totalContributions);
        document.getElementById('real-purchasing-power').textContent = 
            this.formatCurrency(this.results.realPurchasingPower);
    }

    populateAccountsTab() {
        // Update account breakdown
        document.getElementById('future-401k').textContent = 
            this.formatCurrency(this.results.futureValue401k);
        document.getElementById('future-ira').textContent = 
            this.formatCurrency(this.results.futureValueIRA);
        document.getElementById('future-hsa').textContent = 
            this.formatCurrency(this.results.futureValueHSA);
        document.getElementById('future-other').textContent = 
            this.formatCurrency(this.results.futureValueOtherInvestments);

        // Update income sources
        document.getElementById('portfolio-income').textContent = 
            this.formatCurrency(this.results.monthlyIncomeFromPortfolio);
        document.getElementById('total-social-security').textContent = 
            this.formatCurrency(this.results.totalSocialSecurity);
        document.getElementById('pension-income').textContent = 
            this.formatCurrency(this.inputData.pension || 0);
        document.getElementById('part-time-income').textContent = 
            this.formatCurrency(this.inputData.partTimeIncome || 0);
        document.getElementById('other-income').textContent = 
            this.formatCurrency(this.inputData.otherIncome || 0);
    }

    populateAnalysisTab() {
        // Calculate retirement readiness score
        const readinessScore = this.calculateReadinessScore();
        this.updateReadinessScore(readinessScore);

        // Update risk assessment
        this.updateRiskAssessment();

        // Update scenario analysis
        this.updateScenarioAnalysis();
    }

    populateRecommendationsTab() {
        // Generate and categorize recommendations
        const recommendations = this.generateRecommendations();
        this.displayCategorizedRecommendations(recommendations);
        this.generateActionPlan(recommendations);
    }

    calculateReadinessScore() {
        let score = 0;
        let maxScore = 100;

        // Income replacement adequacy (30 points)
        const incomeReplacement = (this.results.totalMonthlyIncome / this.results.monthlyIncomeNeeded) * 100;
        score += Math.min(30, (incomeReplacement / 100) * 30);

        // Savings rate (25 points)
        const totalMonthlyContributions = (this.inputData.monthly401kContribution || 0) + 
                                        (this.inputData.monthlyIRAContribution || 0) + 
                                        (this.inputData.monthlyHSAContribution || 0);
        const savingsRate = (totalMonthlyContributions * 12) / this.results.totalHouseholdIncome * 100;
        score += Math.min(25, (savingsRate / 15) * 25);

        // Emergency fund (15 points)
        const monthlyExpenses = (this.results.totalHouseholdIncome / 12) + 
                              (this.inputData.mortgagePayment || 0) + (this.inputData.otherDebt || 0);
        const emergencyFundMonths = (this.inputData.emergencyFund || 0) / monthlyExpenses;
        score += Math.min(15, (emergencyFundMonths / 6) * 15);

        // Employer match optimization (10 points)
        const annual401k = (this.inputData.monthly401kContribution || 0) * 12;
        const maxMatch = this.inputData.annualIncome * ((this.inputData.employerMatch || 0) / 100);
        if (annual401k >= maxMatch) score += 10;

        // Diversification (10 points)
        const hasMultipleAccounts = (this.inputData.current401k > 0 ? 1 : 0) + 
                                   (this.inputData.currentIRA > 0 ? 1 : 0) + 
                                   (this.inputData.currentHSA > 0 ? 1 : 0) + 
                                   (this.inputData.otherInvestments > 0 ? 1 : 0);
        score += (hasMultipleAccounts / 4) * 10;

        // Longevity planning (10 points)
        if (this.results.ageWhenMoneyRunsOut >= this.inputData.lifeExpectancy) score += 10;

        return Math.min(100, Math.round(score));
    }

    updateReadinessScore(score) {
        const scoreElement = document.getElementById('score-value');
        const descriptionElement = document.getElementById('score-description');
        const circleElement = document.querySelector('.score-circle');

        scoreElement.textContent = `${score}%`;
        
        let description, color;
        if (score >= 80) {
            description = 'Excellent - You\'re on track for a secure retirement';
            color = '#28a745';
        } else if (score >= 60) {
            description = 'Good - Minor adjustments recommended';
            color = '#ffc107';
        } else if (score >= 40) {
            description = 'Fair - Several improvements needed';
            color = '#fd7e14';
        } else {
            description = 'Poor - Significant changes required';
            color = '#dc3545';
        }

        descriptionElement.textContent = description;
        
        // Update circular progress
        const degrees = (score / 100) * 360;
        circleElement.style.background = `conic-gradient(${color} ${degrees}deg, var(--paypal-light-gray) ${degrees}deg)`;
    }

    updateRiskAssessment() {
        // Longevity risk
        const longevityRisk = this.results.ageWhenMoneyRunsOut < this.inputData.lifeExpectancy ? 'High' : 
                             this.results.ageWhenMoneyRunsOut < (this.inputData.lifeExpectancy + 5) ? 'Medium' : 'Low';
        this.updateRiskLevel('longevity-risk', longevityRisk);

        // Inflation risk
        const realReturn = (this.inputData.preRetirementReturn || 7) - (this.inputData.inflationRate || 3);
        const inflationRisk = realReturn < 3 ? 'High' : realReturn < 5 ? 'Medium' : 'Low';
        this.updateRiskLevel('inflation-risk', inflationRisk);

        // Market risk
        const marketRisk = (this.inputData.preRetirementReturn || 7) > 8 ? 'High' : 'Medium';
        this.updateRiskLevel('market-risk', marketRisk);

        // Healthcare cost risk
        const healthcareRisk = (this.inputData.healthcareCosts || 0) < 400 ? 'High' : 
                              (this.inputData.healthcareCosts || 0) < 700 ? 'Medium' : 'Low';
        this.updateRiskLevel('healthcare-risk', healthcareRisk);
    }

    updateRiskLevel(elementId, level) {
        const element = document.getElementById(elementId);
        element.textContent = level;
        element.className = 'risk-level';
        
        if (level === 'Low') {
            element.style.background = '#d4edda';
            element.style.color = '#155724';
        } else if (level === 'Medium') {
            element.style.background = '#fff3cd';
            element.style.color = '#856404';
        } else {
            element.style.background = '#f8d7da';
            element.style.color = '#721c24';
        }
    }

    updateScenarioAnalysis() {
        // Optimistic scenario (9% return)
        const optimisticValue = this.calculateScenario(9);
        document.getElementById('optimistic-value').textContent = this.formatCurrency(optimisticValue);

        // Expected scenario (current input)
        document.getElementById('expected-value').textContent = this.formatCurrency(this.results.totalAtRetirement);

        // Conservative scenario (5% return)
        const conservativeValue = this.calculateScenario(5);
        document.getElementById('conservative-value').textContent = this.formatCurrency(conservativeValue);
    }

    calculateScenario(returnRate) {
        const yearsToRetirement = this.results.yearsToRetirement;
        const currentSavings = this.results.currentTotalSavings;
        const monthlyContributions = (this.inputData.monthly401kContribution || 0) + 
                                    (this.inputData.monthlyIRAContribution || 0) + 
                                    (this.inputData.monthlyHSAContribution || 0);
        const annualContributions = monthlyContributions * 12;
        
        // Simple future value calculation with different return rate
        const futureValueSavings = currentSavings * Math.pow(1 + (returnRate / 100), yearsToRetirement);
        const futureValueContributions = annualContributions * 
            ((Math.pow(1 + (returnRate / 100), yearsToRetirement) - 1) / (returnRate / 100));
        
        return futureValueSavings + futureValueContributions + this.results.futureValueOtherInvestments;
    }

    generateRecommendations() {
        const recommendations = {
            priority: [],
            optimization: [],
            general: []
        };

        // Priority recommendations
        if (this.results.incomeGap > 0) {
            recommendations.priority.push({
                title: 'Address Income Shortfall',
                message: `You have a monthly income gap of ${this.formatCurrency(this.results.incomeGap)}. This needs immediate attention.`
            });
        }

        // Emergency fund check
        const monthlyExpenses = (this.results.totalHouseholdIncome / 12) + 
                              (this.inputData.mortgagePayment || 0) + (this.inputData.otherDebt || 0);
        const emergencyFundMonths = (this.inputData.emergencyFund || 0) / monthlyExpenses;
        if (emergencyFundMonths < 3) {
            recommendations.priority.push({
                title: 'Build Emergency Fund',
                message: `Your emergency fund covers only ${emergencyFundMonths.toFixed(1)} months of expenses. Build it to 6 months.`
            });
        }

        // Employer match optimization
        const annual401k = (this.inputData.monthly401kContribution || 0) * 12;
        const maxMatch = this.inputData.annualIncome * ((this.inputData.employerMatch || 0) / 100);
        if (annual401k < maxMatch) {
            recommendations.optimization.push({
                title: 'Maximize Employer Match',
                message: `You're missing ${this.formatCurrency((maxMatch - annual401k) / 12)} monthly in employer matching.`
            });
        }

        // Savings rate optimization
        const totalMonthlyContributions = (this.inputData.monthly401kContribution || 0) + 
                                        (this.inputData.monthlyIRAContribution || 0) + 
                                        (this.inputData.monthlyHSAContribution || 0);
        const savingsRate = (totalMonthlyContributions * 12) / this.results.totalHouseholdIncome * 100;
        if (savingsRate < 15) {
            recommendations.optimization.push({
                title: 'Increase Savings Rate',
                message: `Your current savings rate is ${savingsRate.toFixed(1)}%. Target 15% for optimal retirement security.`
            });
        }

        // HSA optimization
        if ((this.inputData.monthlyHSAContribution || 0) > 0 && (this.inputData.monthlyHSAContribution || 0) < 350) {
            recommendations.optimization.push({
                title: 'Maximize HSA Contributions',
                message: 'HSA offers triple tax advantages. Consider maximizing contributions for healthcare and retirement.'
            });
        }

        // PayPal Savings - High Priority Optimization
        const emergencyFund = this.inputData.emergencyFund || 0;
        if (emergencyFund > 0) {
            recommendations.optimization.unshift({
                title: '🚀 Maximize Your Savings with PayPal Savings',
                message: `Earn 3.80% APY¹ with PayPal Savings - that's 9x the national average! Your emergency fund of ${this.formatCurrency(emergencyFund)} could earn an extra ${this.formatCurrency((emergencyFund * 0.038) - (emergencyFund * 0.004))} annually compared to typical savings accounts. FDIC-insured through Synchrony Bank with no minimums or fees.`,
                link: 'https://www.paypal.com/us/digital-wallet/manage-money/start-saving',
                highlight: true,
                category: 'paypal-product'
            });
        } else {
            recommendations.optimization.unshift({
                title: '🚀 Start Building Wealth with PayPal Savings',
                message: `Begin your retirement savings journey with PayPal Savings earning 3.80% APY¹ - 9x the national average! Perfect for building your emergency fund and growing your money. FDIC-insured with no minimums or fees.`,
                link: 'https://www.paypal.com/us/digital-wallet/manage-money/start-saving',
                highlight: true,
                category: 'paypal-product'
            });
        }

        // General recommendations
        recommendations.general.push({
            title: 'Regular Review',
            message: 'Review and update your retirement plan annually or after major life changes.'
        });

        recommendations.general.push({
            title: 'Diversification',
            message: 'Ensure your investment portfolio is well-diversified across asset classes and account types.'
        });

        return recommendations;
    }

    displayCategorizedRecommendations(recommendations) {
        this.displayRecommendationList('priority-recommendations-list', recommendations.priority);
        this.displayRecommendationList('optimization-recommendations-list', recommendations.optimization);
        this.displayRecommendationList('general-recommendations-list', recommendations.general);
    }

    displayRecommendationList(containerId, recommendations) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        recommendations.forEach(rec => {
            const item = document.createElement('div');
            // Special styling for PayPal product recommendations
            item.className = rec.highlight ? 'recommendation-item paypal-highlight' : 'recommendation-item';
            
            const linkHtml = rec.link ? `<br><a href="${rec.link}" target="_blank" class="paypal-cta-link">Learn More & Get Started →</a>` : '';
            
            item.innerHTML = `
                <strong>${rec.title}:</strong> ${rec.message}${linkHtml}
            `;
            container.appendChild(item);
        });

        if (recommendations.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">No specific recommendations in this category.</p>';
        }
    }

    generateActionPlan(recommendations) {
        const immediateActions = document.getElementById('immediate-actions');
        const shortTermActions = document.getElementById('short-term-actions');
        const longTermActions = document.getElementById('long-term-actions');

        // Clear existing content
        [immediateActions, shortTermActions, longTermActions].forEach(list => list.innerHTML = '');

        // Immediate actions (next 30 days)
        const immediate = [
            'Consider opening PayPal Savings account (3.80% APY - 9x national average)',
            'Review and optimize employer 401(k) match',
            'Set up automatic contributions if not already in place',
            'Check beneficiary designations on all accounts'
        ];

        if (this.results.incomeGap > 0) {
            immediate.unshift('Calculate additional monthly savings needed');
        }

        immediate.forEach(action => {
            const li = document.createElement('li');
            li.textContent = action;
            immediateActions.appendChild(li);
        });

        // Short-term actions (next 6 months)
        const shortTerm = [
            'Build emergency fund to 6 months of expenses',
            'Increase retirement contributions by 1-2%',
            'Consider opening additional tax-advantaged accounts',
            'Review and rebalance investment allocations'
        ];

        shortTerm.forEach(action => {
            const li = document.createElement('li');
            li.textContent = action;
            shortTermActions.appendChild(li);
        });

        // Long-term actions (next 1-2 years)
        const longTerm = [
            'Maximize all tax-advantaged account contributions',
            'Consider tax-loss harvesting strategies',
            'Plan for healthcare costs in retirement',
            'Review estate planning documents',
            'Consider long-term care insurance'
        ];

        longTerm.forEach(action => {
            const li = document.createElement('li');
            li.textContent = action;
            longTermActions.appendChild(li);
        });
    }

    generateSavingsChart() {
        const ctx = document.getElementById('savings-chart').getContext('2d');
        
        if (this.charts.savings) {
            this.charts.savings.destroy();
        }
        
        const projection = this.results.yearlyProjection;
        const labels = projection.map(p => p.age);
        const balanceData = projection.map(p => p.balance);
        const contributionsData = projection.map(p => p.contributions);
        const growthData = projection.map(p => p.growth);
        
        this.charts.savings = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Balance',
                    data: balanceData,
                    borderColor: '#0070ba',
                    backgroundColor: 'rgba(0, 112, 186, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Contributions',
                    data: contributionsData,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }, {
                    label: 'Investment Growth',
                    data: growthData,
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    generateIncomeChart() {
        const ctx = document.getElementById('income-chart').getContext('2d');
        
        if (this.charts.income) {
            this.charts.income.destroy();
        }
        
        const labels = ['401(k)/IRA/HSA', 'Social Security', 'Pension', 'Part-time Work', 'Other Income'];
        const chartData = [
            Math.max(0, this.results.monthlyIncomeFromPortfolio),
            this.results.totalSocialSecurity || 0,
            this.inputData.pension || 0,
            this.inputData.partTimeIncome || 0,
            this.inputData.otherIncome || 0
        ];
        
        // Filter out zero values
        const filteredLabels = [];
        const filteredData = [];
        const filteredColors = [];
        const colors = ['#0070ba', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'];
        
        chartData.forEach((value, index) => {
            if (value > 0) {
                filteredLabels.push(labels[index]);
                filteredData.push(value);
                filteredColors.push(colors[index]);
            }
        });
        
        this.charts.income = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: filteredLabels,
                datasets: [{
                    data: filteredData,
                    backgroundColor: filteredColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                return context.label + ': $' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    refreshCharts() {
        if (this.charts.savings) this.charts.savings.resize();
        if (this.charts.income) this.charts.income.resize();
    }

    updateCardColors() {
        const incomeGapCard = document.getElementById('income-gap').closest('.summary-card');
        const moneyLastsCard = document.getElementById('money-lasts-until').closest('.summary-card');
        
        if (this.results.incomeGap > 0) {
            incomeGapCard.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
        } else {
            incomeGapCard.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        }
        
        if (this.results.ageWhenMoneyRunsOut < 85) {
            moneyLastsCard.style.background = 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)';
        } else {
            moneyLastsCard.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
    }
}

// Initialize the results page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RetirementResults();
}); 
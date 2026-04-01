const { createApp, ref, reactive, computed, onMounted, watch, nextTick, provide, inject } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const API = '/api';

// ══════════════════════════ i18n ══════════════════════════
const currentLang = ref(localStorage.getItem('lang') || 'zh');
function setLang(lang) {
  currentLang.value = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}
// Initialize html lang attribute
document.documentElement.lang = currentLang.value === 'zh' ? 'zh-CN' : 'en';

const messages = {
  zh: {
    // Nav
    navBrand: '汽配反向保理 — AI风控系统',
    navDashboard: '仪表盘',
    navCustomers: '客户管理',
    navApplications: '申请管理',

    // Shared labels
    riskLow: '低风险',
    riskMedium: '中风险',
    riskHigh: '高风险',
    statusActive: '正常',
    statusWatchlist: '观察名单',
    statusSuspended: '已冻结',
    statusInactive: '未激活',
    term3: '3个月（90天）',
    term6: '6个月（180天）',
    receivableNotYetDue: '未到期',
    receivableDue: '已到期',
    receivableOverdue: '逾期',
    receivablePaid: '买方已付款',
    disbursed: '已放款',
    notDisbursed: '未放款',

    // Application status labels
    appStatusPending: '待审',
    appStatusApproved: '已批准',
    appStatusRejected: '已拒绝',

    // Use of funds labels
    fundsInventory: '库存采购',
    fundsEquipment: '设备采购',
    fundsWorkingCapital: '流动资金',

    // Industry labels
    industryAutoPartsWholesale: '汽配批发',
    industryAutoPartsRetail: '汽配零售',
    industryAutoRepair: '汽车维修',
    industryVehicleDealer: '车辆经销商',

    // Buttons
    btnSave: '保存',
    btnCancel: '取消',
    btnDetail: '详情',
    btnBack: '返回',
    btnRetry: '重试',
    btnNewCustomer: '+ 新增客户',
    btnNewApplication: '+ 新增申请',

    // Common
    loading: '加载中...',
    noData: '-',

    // Page titles
    titleDashboard: '仪表盘',
    titleCustomerManagement: '客户管理',
    titleAllApplications: '所有申请',

    // Grade labels
    gradeA: 'A – 优秀',
    gradeB: 'B – 良好',
    gradeC: 'C – 一般',
    gradeD: 'D – 较差',

    // Dashboard
    dashTitle: '仪表盘',
    dashQuickGuideTitle: '系统使用说明（点击展开）',
    dashStep1Title: '注册客户',
    dashStep1Desc: '进入<em>客户管理</em>，添加买方资料、信用等级和联系方式。',
    dashStep2Title: '提交申请',
    dashStep2Desc: '进入<em>新增申请</em>，选择客户，填写合同和贷款信息后保存。',
    dashStep3Title: 'AI风险评估',
    dashStep3Desc: '系统从4个维度（每项25分，满分100）对申请进行评分，并推荐贷款条件。',
    dashStep4Title: '审批决策',
    dashStep4Desc: '在客户详情的<em>贷前评估</em>标签页中查看AI评估结果，提交审批决定。',
    dashKeyConcepts: '<strong>核心概念：</strong><em>风险评分</em>（0–100，AI计算）决定<em>风险等级</em>（低风险 ≥80 / 中风险 ≥60 / 高风险 <60）。<em>信用等级</em>（A–D）为独立的人工评估。<em>贷款比例</em> = 贷款金额 ÷ 合同金额。',
    dashCurrentOutstanding: '当前在贷余额',
    dashCurrentOutstandingTip: '当前活跃贷款的未偿余额。',
    dashOfLimit: '额度上限 {0}',
    dashRemainingCapacity: '剩余额度',
    dashUtilization: '使用率 {0}',
    dashAccountsReceivable: '应收账款',
    dashAccountsReceivableTip: '买方尚未偿还的已放款贷款总额。',
    dashUnpaidFromBuyers: '买方未付',
    dashAccountsPayable: '应付账款',
    dashAccountsPayableTip: '已批准但尚未放款的应付供应商总额。',
    dashPayablesToSuppliers: '应付供应商',
    dashProjectUtilization: '项目额度使用率',
    dashCustomers: '客户数',
    dashApplications: '申请数',
    dashTotalLoanVolume: '贷款总量',
    dashTotalLoanVolumeTip: '所有贷款的已放款总量，包括已还清的。',
    dashAllApplications: '全部申请',
    dashAvgRiskScore: '平均风险评分',
    dashAvgRiskScoreTip: '所有申请风险评分的平均值。80–100 = 低风险，60–79 = 中风险，60以下 = 高风险。',
    dashPortfolioWeighted: '组合加权',
    dashOverdueLoans: '逾期贷款',
    dashOverdueLoansTip: '逾期敞口：买方超过应付日期（DPD > 0）的贷款总额和数量。',
    dashOverdueHighest: '最高：{name} — 逾期 {dpd} 天',
    dashNoOverdueLoans: '无逾期贷款',
    dashCollectionEfficiency: '回收效率',
    dashCollectionEfficiencyTip: '回收效率：已到期贷款中买方完全偿还的比例，以及从到期日到收款的平均天数。',
    dashOnTarget: '达标',
    dashBelowTarget: '低于80%目标',
    dashAvgDaysToCollect: '平均回收天数：D+25',
    dashRiskDistribution: '风险分布',
    dashApplicationsLabel: '申请',
    dashApplicationStatus: '申请状态',
    dashNumberOfApplications: '（申请数量）',
    dashAIPortfolioInsight: 'AI风控总览',
    dashChartLow: '低风险',
    dashChartMedium: '中风险',
    dashChartHigh: '高风险',
    dashChartApplications: '申请',

    // Customers page
    custTitle: '客户管理',
    custNewCustomer: '+ 新增客户',
    custThId: 'ID',
    custThName: '客户名称',
    custThCityPort: '城市/港口',
    custThGrade: '等级',
    custThCreditLimit: '授信额度',
    custThOutstanding: '在贷余额',
    custThUtilization: '使用率',
    custThRiskScore: '风险评分',
    custThEverOverdue: '历史逾期',
    custThActions: '操作',
    custDetail: '详情',
    custOverdueTitleYes: '该客户存在历史逾期贷款记录',
    custOverdueTitleNo: '无逾期历史',
    custModalTitle: '新增客户',
    custLabelName: '客户名称',
    custLabelCityPortType: '城市/港口类型',
    custOptionCity: '城市',
    custOptionPort: '港口',
    custLabelCityPort: '城市/港口',
    custLabelIndustry: '行业类型',
    custOptWholesale: '汽配批发',
    custOptRetail: '汽配零售',
    custOptRepair: '汽车维修',
    custOptDealer: '车辆经销商',
    custLabelYears: '汽配行业年限',
    custLabelCoopMonths: '合作月数',
    custCoopMonthsTip: '该客户与我们的合作时长（月）。',
    custLabelHistoricalOrder: '历史订单金额（ZAR）',
    custHistoricalOrderTip: '该客户过去所有采购订单的总金额。',
    custLabelContactName: '联系人',
    custLabelContactPhone: '联系电话',
    custLabelKeyCustomer: '核心客户',
    custOptionYes: '是',
    custOptionNo: '否',
    custLabelCreditGrade: '内部信用等级',
    custCreditGradeTip: 'A = 优秀，B = 良好，C = 一般，D = 较差。由风控团队主观评定。',
    custAutoGenHint: '客户ID将自动生成。',
    custFailedCreate: '创建客户失败：',
    custUnknownError: '未知错误',
    custNetworkError: '网络错误：',

    // Customer Detail
    cdKeyCustomer: '核心客户',
    cdGradeLabel: '等级：{0}',
    cdBack: '返回',
    cdSuspendedBanner: '状态：已冻结（高风险）。该客户的新申请将升级至高级审批。',
    cdWatchlistBanner: '客户处于观察名单（中风险）。所有新申请需人工审批，无自动通过流程。',
    cdCustomerProfile: '客户资料',
    cdCustomerId: '客户ID',
    cdCountry: '国家',
    cdLocation: '所在地',
    cdIndustry: '行业',
    cdYearsInAuto: '汽配行业年限',
    cdCoopMonths: '合作月数',
    cdHistoricalOrders: '历史订单',
    cdInternalCreditGrade: '内部信用等级',
    cdInternalCreditGradeTip: '由风控团队人工评定（A = 优秀，B = 良好，C = 一般，D = 较差）。与AI风险评分独立。',
    cdContact: '联系方式',
    cdCreditExposure: '信用敞口',
    cdTotalCreditLimit: '授信总额度',
    cdTotalCreditLimitTip: '该客户的最大授信额度。',
    cdTotalDisbursed: '累计放款',
    cdTotalDisbursedTip: '所有申请的累计放款金额，包括已还清的。',
    cdCurrentOutstanding: '当前在贷余额',
    cdCurrentOutstandingTip: '尚未偿还的活跃贷款余额。',
    cdUtilization: '使用率',
    cdUtilizationTip: '当前在贷余额 / 授信总额度。使用率越高，客户越接近授信上限。',
    cdAppSummaryRisk: '申请概况 & 风险',
    cdTotalApplications: '申请总数',
    cdTotalAppAmount: '申请总金额',
    cdCurrentRiskLevel: '当前风险等级',
    cdCurrentRiskLevelTip: '由AI风险评分推导：低风险（80–100），中风险（60–79），高风险（0–59）。决定客户状态。',
    cdRiskScore: '风险评分',
    cdRiskScoreTip: 'AI从4个维度（每项25分）计算：经营稳定性、还款记录、融资结构、物流提货。',
    cdTabPreLoan: '贷前评估',
    cdTabInLoan: '贷中监控',
    cdTabPostLoan: '贷后与治理',
    cdPendingApps: '待审申请',
    cdApprovalDecision: '审批决策',
    cdApprovalDesc: '请查看下方AI评估结果，然后选择：<strong>通过</strong>进行融资，或<strong>拒绝</strong>。',
    cdDecision: '决策',
    cdApprove: '通过',
    cdReject: '拒绝',
    cdReason: '原因',
    cdReasonPlaceholder: '例如：按AI建议通过 / 需高级审批 / 抵押品不足...',
    cdSubmitting: '提交中...',
    cdSubmitDecision: '提交决策',
    cdApplication: '申请：{0}',
    cdEscalated: '已升级',
    cdDecisionLabel: '决策：{0}',
    cdDecisionApproved: '已通过',
    cdDecisionRejected: '已拒绝',
    cdDate: '日期',
    cdContractAmount: '合同金额',
    cdLoanRatio: '贷款比例',
    cdLoanRatioTip: '贷款金额 ÷ 合同金额。比例越低，杠杆越小，风险越低。',
    cdLoanAmount: '贷款金额',
    cdOutsideBand: '超出推荐区间',
    cdOutsideBandTip: '申请贷款金额超出AI推荐范围。请考虑调整金额或记录偏差原因。',
    cdDownPayment: '首付款',
    cdLoanTerm: '贷款期限',
    cdTermMismatch: '期限不匹配',
    cdTermMismatchTip: '所选贷款期限与AI推荐不同。这可能增加风险——请查看AI说明。',
    cdUseOfFunds: '资金用途',
    cdReceivableStatus: '应收状态',
    cdRiskAssessment: '风险评估',
    cdAIRiskSummary: 'AI风险摘要',
    cdAICreditRec: 'AI信贷建议',
    cdRecLoanBand: '推荐贷款区间',
    cdRecTerm: '推荐期限',
    cdRecDownPayment: '推荐首付比例',
    cdAnomalyFlags: '异常标记',
    cdShowExplanation: '查看评分说明',
    cdAINotGenerated: 'AI评估尚未生成。',
    cdGenerating: '生成中...',
    cdGenerateAI: '生成AI评估',
    cdNoPendingApps: '该客户暂无待审申请。',
    cdCreateNewApp: '新增申请',
    cdAISummaryAndRec: 'AI风险摘要 & 信贷建议',
    cdInLoanDesc: '已批准但尚未完全还款的贷款——物流、提货及逾期追踪',
    cdNoActiveLoans: '暂无正在监控的活跃贷款。',
    cdApproved: '已批准',
    cdOverdueDays: '逾期：{0}天',
    cdTabAppInfo: '申请信息',
    cdTabLogistics: '物流 & 提货',
    cdOverdueDaysLabel: '逾期天数',
    cdDisbursement: '放款状态',
    cdDisbursementTip: '贷款资金是否已发放给供应商。',
    cdReceivableStatusTip: '买方付款义务状态：\\n未到期：付款日尚未到来。\\n已到期：付款日已到（理想的放款时点）。\\n逾期：超过付款日，买方未付。\\n买方已付款：买方已付，资金已收到。',
    cdTradeLogistics: '贸易物流',
    cdEditLogistics: '编辑物流',
    cdAddLogistics: '添加物流',
    cdETD: 'ETD（预计发货）',
    cdETA: 'ETA（预计到达）',
    cdActualArrival: '实际到达日期',
    cdGoodsType: '货物类型',
    cdBrakeParts: '制动部件',
    cdEngineParts: '发动机部件',
    cdBodyParts: '车身部件',
    cdSuspensionParts: '悬挂部件',
    cdMixedParts: '混合部件',
    cdAccessories: '配件',
    cdGoodsLiquidity: '货物流动性',
    cdGoodsLiquidityTip: '货物在公开市场上的变现难易程度。流动性越高 = 抵押品风险越低。',
    cdLiquidityHigh: '高',
    cdLiquidityMedium: '中',
    cdLiquidityLow: '低',
    cdSaveLogistics: '保存物流信息',
    cdPending: '待定',
    cdNoLogistics: '暂无物流数据。点击"添加物流"录入发货信息。',
    cdPickupRecords: '提货记录',
    cdPickupRecordsTip: '提货 = 买方从仓库提取货物。提货缓慢或不规律可能表明现金流问题或虚假贸易。',
    cdAddPickup: '添加提货',
    cdPickupDate: '提货日期',
    cdPercentage: '比例（%）',
    cdNote: '备注',
    cdNotePlaceholder: '例如：第一批已提取',
    cdSavePickupRecord: '保存提货记录',
    cdFirstPickup: '首次提货',
    cdNumberOfPickups: '提货次数',
    cdTotalCompletionDays: '总完成天数',
    cdDaysArrivalToPickup: '到达至首次提货天数',
    cdPickupPattern: '提货模式',
    cdNoPickupRecords: '暂无提货记录。点击"添加提货"记录货物提取。',
    cdPostLoanAlerts: '贷后预警（{0}）',
    cdDelinquencyHistory: '逾期 & 违约历史',
    cdDelinquencyTip: '逾期天数（DPD）衡量买方付款义务到期后的天数。在反向保理中，逾期方为买方（非客户）。贷款方承担信用风险直至买方付款。',
    cdThApplication: '申请',
    cdThLoanAmount: '贷款金额',
    cdThTerm: '期限',
    cdThDPDSeverity: 'DPD严重程度',
    cdThReceivable: '应收',
    cdThRecovery: '回收',
    cdThStatus: '状态',
    cdBuyerDPD: '买方DPD {dpd}天 — {label}',
    cdDPDSevere: '严重',
    cdDPDCritical: '紧急',
    cdDPDElevated: '偏高',
    cdDPDMild: '轻微',
    cdNoOverdueApps: '无逾期申请。',
    cdBatchActionsLabel: 'DPD 30+批量操作：',
    cdSendCollection: '发送催收通知',
    cdFreezeCustomer: '冻结客户',
    cdNotifyLegal: '通知法务',
    cdRejectedApps: '已拒绝 / 已拒贷申请',
    cdNoRejectedApps: '无已拒绝申请。',
    cdDecisionField: '决策',
    cdOverrideHistory: '改判历史',
    cdOverrideHistoryText: 'AI推荐：{risk}风险。人工决策：{decision}。原因：{reason}',
    cdGovernanceNotes: '治理备注',
    cdNoGovernance: '该客户暂无改判或治理决策记录。',
    cdAIRiskScoreLabel: 'AI风险评分',
    cdHumanDecision: '人工决策',
    cdOverrideReason: '改判原因',
    cdFollowUpActions: '后续行动',
    cdFinalOutcome: '最终结果',
    cdRetry: '重试',
    cdLoading: '加载中...',
    cdFailedToLoad: '加载客户失败：',
    cdFailedGenerateAI: 'AI评估生成失败，请重试。',
    cdFailedSubmitDecision: '提交决策失败，请重试。',
    cdBatchActionDemo: '操作：{action}\\n\\n这是演示占位。生产环境中将触发相应的工作流。',
    cdScoreStability: '经营稳定性',
    cdScoreStabilityTip: '行业经验、合作时长、订单历史',
    cdScoreRepayment: '还款记录',
    cdScoreRepaymentTip: '过往贷款还款记录、逾期历史',
    cdScoreStructure: '融资结构',
    cdScoreStructureTip: '贷款比例、首付充足性、期限合理性',
    cdScoreLogistics: '物流 & 提货',
    cdScoreLogisticsTip: '货物到达、提货速度、完成模式',
    cdAlertDPDCritical: '{id}：买方DPD {dpd}天 — 超过30天阈值，需催收/法律行动',
    cdAlertDPDWarning: '{id}：买方DPD {dpd}天 — 接近紧急阈值',
    cdAlertSlowPickup: '{id}：提货速度异常缓慢 — 抵押品周转风险',
    cdAlertDelayedPickup: '{id}：到达后{days}天首次提货 — 启动延迟',
    cdAlertLowLiquidity: '{id}：低流动性货物 — 违约时抵押品处置难度较高',
    cdAlertCreditUtil: '信用使用率已达{pct}% — 接近上限',

    // Applications page
    appTitle: '所有申请',
    appNewApplication: '+ 新增申请',
    appFilterLabel: '按状态筛选：',
    appFilterAll: '全部',
    appFilterPending: '待审',
    appFilterApproved: '已批准',
    appFilterRejected: '已拒绝',
    appThId: 'ID',
    appThCustomer: '客户',
    appThLoan: '贷款',
    appThRatio: '比例',
    appThDate: '日期',
    appThTerm: '期限',
    appThMaturity: '到期日',
    appThStatus: '状态',
    appThDisbursement: '放款',
    appThRisk: '风险',
    appThOverdue: '逾期',
    appThActions: '操作',
    appMonths: '{0}个月',
    appNoMatch: '没有匹配此筛选条件的申请。',
    appModalTitle: '新增申请',
    appHighRiskWarning: '高风险客户 — 申请将升级至高级审批。',
    appLabelCustomer: '客户',
    appSelectCustomer: '请选择客户...',
    appLabelDate: '申请日期',
    appLabelContractAmount: '合同金额（ZAR）',
    appLabelLoanAmount: '申请贷款金额（ZAR）',
    appLabelDownPayment: '首付款（ZAR）',
    appLabelLoanTerm: '贷款期限',
    appLabelUseOfFunds: '资金用途',
    appOptInventory: '库存采购',
    appOptEquipment: '设备采购',
    appOptWorkingCapital: '流动资金',
    appLabelLoanRatio: '贷款比例',
    appLoanRatioTip: '贷款金额 ÷ 合同金额。比例越低，杠杆越小，风险越低。',
    appAutoCalculated: '自动计算',
    appSaving: '保存中...',
    appSave: '保存',
    appSaveAndAI: '保存并AI评估',
    appCreated: '{id} 已创建！',
    appAIGenerated: ' AI评估已生成。',
    appEscalatedMsg: ' 已升级至高级审批。',
  },
  en: {
    // Nav
    navBrand: 'Auto Parts Reverse Factoring — AI Risk Control',
    navDashboard: 'Dashboard',
    navCustomers: 'Customers',
    navApplications: 'Applications',

    // Shared labels
    riskLow: 'Low',
    riskMedium: 'Medium',
    riskHigh: 'High',
    statusActive: 'Active',
    statusWatchlist: 'Watchlist',
    statusSuspended: 'Suspended',
    statusInactive: 'Inactive',
    term3: '3 months (90 days)',
    term6: '6 months (180 days)',
    receivableNotYetDue: 'Not yet due',
    receivableDue: 'Due',
    receivableOverdue: 'Overdue',
    receivablePaid: 'Paid by buyer',
    disbursed: 'Disbursed',
    notDisbursed: 'Not disbursed',

    // Application status labels
    appStatusPending: 'Pending',
    appStatusApproved: 'Approved',
    appStatusRejected: 'Rejected',

    // Use of funds labels
    fundsInventory: 'Inventory Purchase',
    fundsEquipment: 'Equipment Purchase',
    fundsWorkingCapital: 'Working Capital',

    // Industry labels
    industryAutoPartsWholesale: 'Auto Parts Wholesale',
    industryAutoPartsRetail: 'Auto Parts Retail',
    industryAutoRepair: 'Auto Repair',
    industryVehicleDealer: 'Vehicle Dealer',

    // Buttons
    btnSave: 'Save',
    btnCancel: 'Cancel',
    btnDetail: 'Detail',
    btnBack: 'Back',
    btnRetry: 'Retry',
    btnNewCustomer: '+ New Customer',
    btnNewApplication: '+ New Application',

    // Common
    loading: 'Loading...',
    noData: '-',

    // Page titles
    titleDashboard: 'Dashboard',
    titleCustomerManagement: 'Customer Management',
    titleAllApplications: 'All Applications',

    // Grade labels
    gradeA: 'A – Excellent',
    gradeB: 'B – Good',
    gradeC: 'C – Fair',
    gradeD: 'D – Poor',

    // Dashboard
    dashTitle: 'Dashboard',
    dashQuickGuideTitle: 'How does this system work? (click to expand)',
    dashStep1Title: 'Register a Customer',
    dashStep1Desc: 'Go to <em>Customers</em> and add the buyer\u2019s profile, credit grade, and contact info.',
    dashStep2Title: 'Submit an Application',
    dashStep2Desc: 'Go to <em>New Application</em>, select the customer, fill in contract & loan details, then save.',
    dashStep3Title: 'AI Risk Assessment',
    dashStep3Desc: 'The system scores the application across 4 dimensions (25 pts each, 100 total) and recommends loan terms.',
    dashStep4Title: 'Approve or Reject',
    dashStep4Desc: 'Review the AI output in the customer\u2019s <em>Pre-loan Assessment</em> tab and submit your decision.',
    dashKeyConcepts: '<strong>Key concepts:</strong> <em>Risk Score</em> (0\u2013100, AI-computed) determines <em>Risk Level</em> (Low \u226580 / Medium \u226560 / High <60). <em>Credit Grade</em> (A\u2013D) is a separate manual assessment. <em>Loan Ratio</em> = Loan Amount \u00f7 Contract Amount.',
    dashCurrentOutstanding: 'Current Outstanding',
    dashCurrentOutstandingTip: 'Current outstanding balance for active loans.',
    dashOfLimit: 'of {0} limit',
    dashRemainingCapacity: 'Remaining Capacity',
    dashUtilization: 'utilization {0}',
    dashAccountsReceivable: 'Accounts Receivable',
    dashAccountsReceivableTip: 'Total amount owed to us by buyers for disbursed loans not yet repaid.',
    dashUnpaidFromBuyers: 'unpaid from buyers',
    dashAccountsPayable: 'Accounts Payable',
    dashAccountsPayableTip: 'Total amount we owe to suppliers for approved loans pending disbursement.',
    dashPayablesToSuppliers: 'payables to suppliers',
    dashProjectUtilization: 'Project Utilization',
    dashCustomers: 'Customers',
    dashApplications: 'Applications',
    dashTotalLoanVolume: 'Total Loan Volume',
    dashTotalLoanVolumeTip: 'Total disbursed loan volume for all loans, including repaid ones.',
    dashAllApplications: 'all applications',
    dashAvgRiskScore: 'Avg Risk Score',
    dashAvgRiskScoreTip: 'Average of all application risk scores. 80\u2013100 = Low risk, 60\u201379 = Medium, below 60 = High risk.',
    dashPortfolioWeighted: 'portfolio weighted',
    dashOverdueLoans: 'Overdue Loans',
    dashOverdueLoansTip: 'Overdue exposure: total loan amount and count of applications where the buyer has missed the payment due date (DPD > 0).',
    dashOverdueHighest: 'Highest: {name} \u2014 {dpd} days overdue',
    dashNoOverdueLoans: 'No overdue loans',
    dashCollectionEfficiency: 'Collection Efficiency',
    dashCollectionEfficiencyTip: 'Collection efficiency: percentage of matured loan amounts that have been fully repaid by buyers, and average days from due date to payment.',
    dashOnTarget: 'On target',
    dashBelowTarget: 'Below target 80%',
    dashAvgDaysToCollect: 'Avg days to collect: D+25',
    dashRiskDistribution: 'Risk Distribution',
    dashApplicationsLabel: 'Applications',
    dashApplicationStatus: 'Application Status',
    dashNumberOfApplications: '(number of applications)',
    dashAIPortfolioInsight: 'AI Portfolio Insight',
    dashChartLow: 'Low',
    dashChartMedium: 'Medium',
    dashChartHigh: 'High',
    dashChartApplications: 'Applications',

    // Customers page
    custTitle: 'Customer Management',
    custNewCustomer: '+ New Customer',
    custThId: 'ID',
    custThName: 'Name',
    custThCityPort: 'City/Port',
    custThGrade: 'Grade',
    custThCreditLimit: 'Credit Limit',
    custThOutstanding: 'Outstanding',
    custThUtilization: 'Utilization',
    custThRiskScore: 'Risk Score',
    custThEverOverdue: 'Ever Overdue',
    custThActions: 'Actions',
    custDetail: 'Detail',
    custOverdueTitleYes: 'This customer has at least one historical overdue loan',
    custOverdueTitleNo: 'No overdue history',
    custModalTitle: 'New Customer',
    custLabelName: 'Name',
    custLabelCityPortType: 'City/Port Type',
    custOptionCity: 'City',
    custOptionPort: 'Port',
    custLabelCityPort: 'City/Port',
    custLabelIndustry: 'Industry',
    custOptWholesale: 'Auto Parts Wholesale',
    custOptRetail: 'Auto Parts Retail',
    custOptRepair: 'Auto Repair',
    custOptDealer: 'Vehicle Dealer',
    custLabelYears: 'Years in Auto Parts',
    custLabelCoopMonths: 'Cooperation Months',
    custCoopMonthsTip: 'How many months this customer has been doing business with us.',
    custLabelHistoricalOrder: 'Historical Order Amount (ZAR)',
    custHistoricalOrderTip: 'Total value of all past purchase orders placed by this customer.',
    custLabelContactName: 'Contact Name',
    custLabelContactPhone: 'Contact Phone',
    custLabelKeyCustomer: 'Key Customer',
    custOptionYes: 'Yes',
    custOptionNo: 'No',
    custLabelCreditGrade: 'Internal Credit Grade',
    custCreditGradeTip: 'A = Excellent, B = Good, C = Fair, D = Poor. Subjective assessment by the risk team.',
    custAutoGenHint: 'Customer ID will be auto-generated.',
    custFailedCreate: 'Failed to create customer: ',
    custUnknownError: 'Unknown error',
    custNetworkError: 'Network error: ',

    // Customer Detail
    cdKeyCustomer: 'Key Customer',
    cdGradeLabel: 'Grade: {0}',
    cdBack: 'Back',
    cdSuspendedBanner: 'Status: Suspended (High Risk). New applications for this customer will be escalated for senior approval.',
    cdWatchlistBanner: 'Customer is on Watchlist (Medium Risk). All new applications require manual approval. No auto-pass flow.',
    cdCustomerProfile: 'Customer Profile',
    cdCustomerId: 'Customer ID',
    cdCountry: 'Country',
    cdLocation: 'Location',
    cdIndustry: 'Industry',
    cdYearsInAuto: 'Years in Auto Parts',
    cdCoopMonths: 'Cooperation Months',
    cdHistoricalOrders: 'Historical Orders',
    cdInternalCreditGrade: 'Internal Credit Grade',
    cdInternalCreditGradeTip: 'Manually assigned by the risk team (A = Excellent, B = Good, C = Fair, D = Poor). Separate from the AI-computed risk score.',
    cdContact: 'Contact',
    cdCreditExposure: 'Credit Exposure',
    cdTotalCreditLimit: 'Total Credit Limit',
    cdTotalCreditLimitTip: 'Maximum approved credit line for this customer.',
    cdTotalDisbursed: 'Total Disbursed',
    cdTotalDisbursedTip: 'Cumulative loan amount disbursed across all applications, including repaid.',
    cdCurrentOutstanding: 'Current Outstanding',
    cdCurrentOutstandingTip: 'Outstanding balance of active loans not yet repaid.',
    cdUtilization: 'Utilization',
    cdUtilizationTip: 'Current outstanding / Total credit limit. High utilization means the customer is close to their credit ceiling.',
    cdAppSummaryRisk: 'Application Summary & Risk',
    cdTotalApplications: 'Total Applications',
    cdTotalAppAmount: 'Total Application Amount',
    cdCurrentRiskLevel: 'Current Risk Level',
    cdCurrentRiskLevelTip: 'Derived from AI risk score: Low (80\u2013100), Medium (60\u201379), High (0\u201359). Determines customer status.',
    cdRiskScore: 'Risk Score',
    cdRiskScoreTip: 'AI-computed score from 4 dimensions (25 pts each): Business Stability, Repayment History, Financing Structure, Logistics and Pickup.',
    cdTabPreLoan: 'Pre-loan Assessment',
    cdTabInLoan: 'In-loan Monitoring',
    cdTabPostLoan: 'Post-loan & Governance',
    cdPendingApps: 'Pending Applications',
    cdApprovalDecision: 'Approval Decision',
    cdApprovalDesc: 'Review the AI assessment below, then choose: <strong>Approve</strong> to proceed with financing or <strong>Reject</strong> to decline.',
    cdDecision: 'Decision',
    cdApprove: 'Approve',
    cdReject: 'Reject',
    cdReason: 'Reason',
    cdReasonPlaceholder: 'e.g. Approved per AI recommendation / Need senior review / Insufficient collateral...',
    cdSubmitting: 'Submitting...',
    cdSubmitDecision: 'Submit Decision',
    cdApplication: 'Application: {0}',
    cdEscalated: 'Escalated',
    cdDecisionLabel: 'Decision: {0}',
    cdDecisionApproved: 'Approved',
    cdDecisionRejected: 'Rejected',
    cdDate: 'Date',
    cdContractAmount: 'Contract Amount',
    cdLoanRatio: 'Loan Ratio',
    cdLoanRatioTip: 'Loan amount \u00f7 Contract amount. A lower ratio means less leverage and lower risk.',
    cdLoanAmount: 'Loan Amount',
    cdOutsideBand: 'Outside recommended band',
    cdOutsideBandTip: 'The requested loan amount falls outside the AI\u2019s recommended range. Consider adjusting or documenting the reason.',
    cdDownPayment: 'Down Payment',
    cdLoanTerm: 'Loan Term',
    cdTermMismatch: 'Term mismatch',
    cdTermMismatchTip: 'The chosen loan term differs from the AI recommendation. This may increase risk \u2014 check the AI explanation for details.',
    cdUseOfFunds: 'Use of Funds',
    cdReceivableStatus: 'Receivable Status',
    cdRiskAssessment: 'Risk Assessment',
    cdAIRiskSummary: 'AI Risk Summary',
    cdAICreditRec: 'AI Credit Recommendation',
    cdRecLoanBand: 'Recommended Loan Band',
    cdRecTerm: 'Recommended Term',
    cdRecDownPayment: 'Recommended Down Payment',
    cdAnomalyFlags: 'Anomaly Flags',
    cdShowExplanation: 'Show Score Explanation',
    cdAINotGenerated: 'AI assessment not yet generated.',
    cdGenerating: 'Generating...',
    cdGenerateAI: 'Generate AI Assessment',
    cdNoPendingApps: 'No pending applications for this customer.',
    cdCreateNewApp: 'Create New Application',
    cdAISummaryAndRec: 'AI Risk Summary & Credit Recommendation',
    cdInLoanDesc: 'Approved loans not yet fully repaid \u2013 logistics, pickup, and overdue tracking',
    cdNoActiveLoans: 'No active loans currently under monitoring.',
    cdApproved: 'Approved',
    cdOverdueDays: 'Overdue: {0} days',
    cdTabAppInfo: 'Application Info',
    cdTabLogistics: 'Logistics & Pickup',
    cdOverdueDaysLabel: 'Overdue Days',
    cdDisbursement: 'Disbursement',
    cdDisbursementTip: 'Whether the loan funds have been released to the supplier.',
    cdReceivableStatusTip: 'Buyer payment obligation status:\\nNot yet due: Payment date has not arrived yet.\\nDue: Payment is due now (ideal disbursement point).\\nOverdue: Payment is past due, buyer has not paid.\\nPaid by buyer: Buyer has paid, funds received.',
    cdTradeLogistics: 'Trade Logistics',
    cdEditLogistics: 'Edit Logistics',
    cdAddLogistics: 'Add Logistics',
    cdETD: 'ETD (Est. Departure)',
    cdETA: 'ETA (Est. Arrival)',
    cdActualArrival: 'Actual Arrival Date',
    cdGoodsType: 'Goods Type',
    cdBrakeParts: 'Brake Parts',
    cdEngineParts: 'Engine Parts',
    cdBodyParts: 'Body Parts',
    cdSuspensionParts: 'Suspension Parts',
    cdMixedParts: 'Mixed Parts',
    cdAccessories: 'Accessories',
    cdGoodsLiquidity: 'Goods Liquidity',
    cdGoodsLiquidityTip: 'How easily the goods can be resold on the open market. Higher liquidity = lower collateral risk.',
    cdLiquidityHigh: 'High',
    cdLiquidityMedium: 'Medium',
    cdLiquidityLow: 'Low',
    cdSaveLogistics: 'Save Logistics',
    cdPending: 'Pending',
    cdNoLogistics: 'No trade logistics data recorded. Click "Add Logistics" to enter shipping details.',
    cdPickupRecords: 'Pickup Records',
    cdPickupRecordsTip: 'Pickup = buyer collecting goods from the warehouse. Slow or irregular pickups may indicate cash flow problems or fraudulent trade.',
    cdAddPickup: 'Add Pickup',
    cdPickupDate: 'Pickup Date',
    cdPercentage: 'Percentage (%)',
    cdNote: 'Note',
    cdNotePlaceholder: 'e.g. First batch collected',
    cdSavePickupRecord: 'Save Pickup Record',
    cdFirstPickup: 'First Pickup',
    cdNumberOfPickups: 'Number of Pickups',
    cdTotalCompletionDays: 'Total Completion Days',
    cdDaysArrivalToPickup: 'Days from Arrival to First Pickup',
    cdPickupPattern: 'Pickup Pattern',
    cdNoPickupRecords: 'No pickup records yet. Click "Add Pickup" to record a goods collection.',
    cdPostLoanAlerts: 'Post-loan Alerts ({0})',
    cdDelinquencyHistory: 'Delinquency & Overdue History',
    cdDelinquencyTip: 'Days Past Due (DPD) measures the number of days since the buyer\u2019s payment obligation became due. In reverse factoring, the overdue party is the buyer (not the customer). The lender bears the credit risk until the buyer pays.',
    cdThApplication: 'Application',
    cdThLoanAmount: 'Loan Amount',
    cdThTerm: 'Term',
    cdThDPDSeverity: 'DPD Severity',
    cdThReceivable: 'Receivable',
    cdThRecovery: 'Recovery',
    cdThStatus: 'Status',
    cdBuyerDPD: 'Buyer DPD {dpd}d \u2014 {label}',
    cdDPDSevere: 'Severe',
    cdDPDCritical: 'Critical',
    cdDPDElevated: 'Elevated',
    cdDPDMild: 'Mild',
    cdNoOverdueApps: 'No overdue applications.',
    cdBatchActionsLabel: 'Batch Actions for DPD 30+:',
    cdSendCollection: 'Send Collection Notice',
    cdFreezeCustomer: 'Freeze Customer',
    cdNotifyLegal: 'Notify Legal',
    cdRejectedApps: 'Rejected / Declined Applications',
    cdNoRejectedApps: 'No rejected applications.',
    cdDecisionField: 'Decision',
    cdOverrideHistory: 'Override History',
    cdOverrideHistoryText: 'AI recommended: {risk} risk. Human decision: {decision}. Reason: {reason}',
    cdGovernanceNotes: 'Governance Notes',
    cdNoGovernance: 'No override or governance decisions recorded for this customer.',
    cdAIRiskScoreLabel: 'AI Risk Score',
    cdHumanDecision: 'Human Decision',
    cdOverrideReason: 'Override Reason',
    cdFollowUpActions: 'Follow-up Actions',
    cdFinalOutcome: 'Final Outcome',
    cdRetry: 'Retry',
    cdLoading: 'Loading...',
    cdFailedToLoad: 'Failed to load customer: ',
    cdFailedGenerateAI: 'Failed to generate AI assessment. Please try again.',
    cdFailedSubmitDecision: 'Failed to submit decision. Please try again.',
    cdBatchActionDemo: 'Action: {action}\\n\\nThis is a demo placeholder. In production this would trigger the corresponding workflow.',
    cdScoreStability: 'Business Stability',
    cdScoreStabilityTip: 'Industry experience, cooperation length, order history',
    cdScoreRepayment: 'Repayment History',
    cdScoreRepaymentTip: 'Past loan repayment track record, overdue history',
    cdScoreStructure: 'Financing Structure',
    cdScoreStructureTip: 'Loan ratio, down payment adequacy, term appropriateness',
    cdScoreLogistics: 'Logistics & Pickup',
    cdScoreLogisticsTip: 'Goods arrival, pickup speed, completion pattern',
    cdAlertDPDCritical: '{id}: Buyer DPD {dpd} days \u2014 exceeds 30-day threshold, collection/legal action required',
    cdAlertDPDWarning: '{id}: Buyer DPD {dpd} days \u2014 approaching critical threshold',
    cdAlertSlowPickup: '{id}: Pickup pace abnormally slow \u2014 collateral turnover risk',
    cdAlertDelayedPickup: '{id}: First pickup {days} days after arrival \u2014 delayed start',
    cdAlertLowLiquidity: '{id}: Low-liquidity goods \u2014 higher collateral disposal difficulty if default occurs',
    cdAlertCreditUtil: 'Credit utilization at {pct}% \u2014 approaching limit',

    // Applications page
    appTitle: 'All Applications',
    appNewApplication: '+ New Application',
    appFilterLabel: 'Filter by status:',
    appFilterAll: 'All',
    appFilterPending: 'Pending',
    appFilterApproved: 'Approved',
    appFilterRejected: 'Rejected',
    appThId: 'ID',
    appThCustomer: 'Customer',
    appThLoan: 'Loan',
    appThRatio: 'Ratio',
    appThDate: 'Date',
    appThTerm: 'Term',
    appThMaturity: 'Maturity',
    appThStatus: 'Status',
    appThDisbursement: 'Disbursement',
    appThRisk: 'Risk',
    appThOverdue: 'Overdue',
    appThActions: 'Actions',
    appMonths: '{0} months',
    appNoMatch: 'No applications match this filter.',
    appModalTitle: 'New Application',
    appHighRiskWarning: 'High Risk customer \u2014 application will be escalated for senior approval.',
    appLabelCustomer: 'Customer',
    appSelectCustomer: 'Select customer...',
    appLabelDate: 'Application Date',
    appLabelContractAmount: 'Contract Amount (ZAR)',
    appLabelLoanAmount: 'Requested Loan Amount (ZAR)',
    appLabelDownPayment: 'Down Payment (ZAR)',
    appLabelLoanTerm: 'Loan Term',
    appLabelUseOfFunds: 'Use of Funds',
    appOptInventory: 'Inventory Purchase',
    appOptEquipment: 'Equipment Purchase',
    appOptWorkingCapital: 'Working Capital',
    appLabelLoanRatio: 'Loan Ratio',
    appLoanRatioTip: 'Loan amount \u00f7 Contract amount. A lower ratio means less leverage and lower risk.',
    appAutoCalculated: 'Auto-calculated',
    appSaving: 'Saving...',
    appSave: 'Save',
    appSaveAndAI: 'Save & AI Assessment',
    appCreated: '{id} created!',
    appAIGenerated: ' AI assessment generated.',
    appEscalatedMsg: ' Escalated for senior approval.',
  }
};

function t(key) {
  const lang = currentLang.value;
  return (messages[lang] && messages[lang][key]) || (messages.en && messages.en[key]) || key;
}

// ══════════════════════════ Helpers ══════════════════════════
function fmtR(v) { return v != null ? 'R' + Number(v).toLocaleString('en-ZA', {minimumFractionDigits: 0}) : '-'; }
function fmtPct(v) { return v != null ? (v * 100).toFixed(0) + '%' : '-'; }
function riskColor(level) { return ({low:'green', medium:'orange', high:'red'})[level] || ''; }
function riskLabel(level) { return ({low:t('riskLow'), medium:t('riskMedium'), high:t('riskHigh')})[level] || level || '-'; }
function custStatusLabel(s) { return ({active:t('statusActive'), watchlist:t('statusWatchlist'), suspended:t('statusSuspended'), inactive:t('statusInactive')})[s] || s; }
function termLabel(m) { return m === 6 ? t('term6') : t('term3'); }
function gradeColor(g) { return ({A:'green', B:'blue', C:'orange', D:'red'})[g] || ''; }
function receivableLabel(s) { return ({not_yet_due:t('receivableNotYetDue'), due:t('receivableDue'), overdue:t('receivableOverdue'), paid:t('receivablePaid')})[s] || s || t('receivableNotYetDue'); }
function receivableColor(s) { return ({not_yet_due:'orange', due:'green', overdue:'red', paid:'settled'})[s] || 'draft'; }
function disbursementLabel(s) { return s === 'disbursed' ? t('disbursed') : t('notDisbursed'); }
function disbursementColor(s) { return s === 'disbursed' ? 'green' : 'draft'; }
function appStatusLabel(s) { return ({pending:t('appStatusPending'), approved:t('appStatusApproved'), rejected:t('appStatusRejected')})[s] || s; }
function fundsLabel(s) { return ({inventory_purchase:t('fundsInventory'), equipment_purchase:t('fundsEquipment'), working_capital:t('fundsWorkingCapital')})[s] || s; }
function industryLabel(s) { return ({auto_parts_wholesale:t('industryAutoPartsWholesale'), auto_parts_retail:t('industryAutoPartsRetail'), auto_repair:t('industryAutoRepair'), vehicle_dealer:t('industryVehicleDealer')})[s] || s; }
function goodsTypeLabel(s) { return ({brake_parts:t('cdBrakeParts'), engine_parts:t('cdEngineParts'), body_parts:t('cdBodyParts'), suspension_parts:t('cdSuspensionParts'), mixed_parts:t('cdMixedParts'), accessories:t('cdAccessories')})[s] || s; }
function decisionLabel(s) { return ({pass:t('cdDecisionApproved'), reject:t('cdDecisionRejected')})[s] || s || '-'; }
function aiText(obj, field) { if (!obj) return ''; if (currentLang.value === 'zh' && obj[field + '_zh']) return obj[field + '_zh']; return obj[field] || ''; }

function parseLoanBand(band) {
  if (!band || band === 'N/A') return null;
  const nums = band.replace(/[R,\s]/g, '').split('-').map(Number);
  if (nums.length === 2 && !isNaN(nums[0]) && !isNaN(nums[1])) return { min: nums[0], max: nums[1] };
  return null;
}
function isLoanOutOfBand(loanAmt, band) {
  const b = parseLoanBand(band);
  if (!b || !loanAmt) return false;
  return loanAmt < b.min || loanAmt > b.max;
}
function isTermMismatch(termMonths, recTerm) {
  if (!recTerm || recTerm === 'N/A') return false;
  if (recTerm.includes('3') && termMonths === 3) return false;
  if (recTerm.includes('6') && termMonths === 6) return false;
  return true;
}

// ══════════════════════════ Dashboard Page ══════════════════════════
const DashboardPage = {
  template: `
    <div>
      <h1 style="margin-bottom:16px">{{t('dashTitle')}}</h1>

      <!-- Quick Start Guide (collapsible) -->
      <details class="quick-guide" style="margin-bottom:20px">
        <summary>{{t('dashQuickGuideTitle')}}</summary>
        <div class="quick-guide-body">
          <div class="quick-guide-steps">
            <div class="quick-guide-step"><span class="quick-guide-num">1</span><div><strong>{{t('dashStep1Title')}}</strong><br><span v-html="t('dashStep1Desc')"></span></div></div>
            <div class="quick-guide-step"><span class="quick-guide-num">2</span><div><strong>{{t('dashStep2Title')}}</strong><br><span v-html="t('dashStep2Desc')"></span></div></div>
            <div class="quick-guide-step"><span class="quick-guide-num">3</span><div><strong>{{t('dashStep3Title')}}</strong><br><span v-html="t('dashStep3Desc')"></span></div></div>
            <div class="quick-guide-step"><span class="quick-guide-num">4</span><div><strong>{{t('dashStep4Title')}}</strong><br><span v-html="t('dashStep4Desc')"></span></div></div>
          </div>
          <p style="margin-top:12px;font-size:12px;color:#868e96" v-html="t('dashKeyConcepts')"></p>
        </div>
      </details>

      <!-- Utilization Warning Banner -->
      <div v-if="stats.utilization_warning" class="warning-banner" :class="{danger: stats.utilization_ratio > 0.85}">
        {{stats.utilization_warning}}
      </div>

      <!-- ═══ ROW 1: Key Financial Metrics ═══ -->
      <div class="dash-kpi-row">
        <div class="dash-kpi-card">
          <div class="dash-kpi-label">{{t('dashCurrentOutstanding')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('dashCurrentOutstandingTip')}}</span></span></div>
          <div class="dash-kpi-value">{{fmtR(stats.current_outstanding)}}</div>
          <div class="dash-kpi-sub">{{t('dashOfLimit').replace('{0}', fmtR(stats.project_total_limit))}}</div>
        </div>
        <div class="dash-kpi-card">
          <div class="dash-kpi-label">{{t('dashRemainingCapacity')}}</div>
          <div class="dash-kpi-value green">{{fmtR(stats.remaining_capacity)}}</div>
          <div class="dash-kpi-sub">{{t('dashUtilization').replace('{0}', fmtPct(stats.utilization_ratio))}}</div>
        </div>
        <div class="dash-kpi-card">
          <div class="dash-kpi-label">{{t('dashAccountsReceivable')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('dashAccountsReceivableTip')}}</span></span></div>
          <div class="dash-kpi-value">{{fmtR(stats.total_accounts_receivable || 0)}}</div>
          <div class="dash-kpi-sub">{{t('dashUnpaidFromBuyers')}}</div>
        </div>
        <div class="dash-kpi-card">
          <div class="dash-kpi-label">{{t('dashAccountsPayable')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('dashAccountsPayableTip')}}</span></span></div>
          <div class="dash-kpi-value">{{fmtR(stats.total_accounts_payable || 0)}}</div>
          <div class="dash-kpi-sub">{{t('dashPayablesToSuppliers')}}</div>
        </div>
      </div>

      <!-- Utilization bar -->
      <div class="dash-util-strip">
        <div class="dash-util-strip-label">{{t('dashProjectUtilization')}}</div>
        <div class="dash-util-strip-bar">
          <div class="dash-util-strip-fill" :class="stats.utilization_ratio>0.7?'red':stats.utilization_ratio>0.5?'orange':'green'" :style="{width: Math.min(stats.utilization_ratio*100,100)+'%'}"></div>
        </div>
        <div class="dash-util-strip-pct" :class="stats.utilization_ratio>0.7?'red':stats.utilization_ratio>0.5?'orange':'green'">{{fmtPct(stats.utilization_ratio)}}</div>
      </div>

      <!-- ═══ ROW 2a: Status Overview (neutral) ═══ -->
      <div class="metrics-tier1">
        <div class="tier1-card">
          <div class="tier1-label">{{t('dashCustomers')}}</div>
          <div class="tier1-value">{{stats.total_customers}}</div>
        </div>
        <div class="tier1-card">
          <div class="tier1-label">{{t('dashApplications')}}</div>
          <div class="tier1-value">{{stats.total_applications}}</div>
        </div>
        <div class="tier1-card">
          <div class="tier1-label">{{t('dashTotalLoanVolume')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('dashTotalLoanVolumeTip')}}</span></span></div>
          <div class="tier1-value">{{fmtR(stats.total_loan_amount)}}</div>
          <div class="tier1-hint">{{t('dashAllApplications')}}</div>
        </div>
        <div class="tier1-card">
          <div class="tier1-label">{{t('dashAvgRiskScore')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('dashAvgRiskScoreTip')}}</span></span></div>
          <div class="tier1-value" :class="stats.avg_risk_score>=80?'green':stats.avg_risk_score>=60?'orange':'red'">{{stats.avg_risk_score}}</div>
          <div class="tier1-hint">{{t('dashPortfolioWeighted')}}</div>
        </div>
      </div>

      <!-- ═══ ROW 2b: Risk Alerts ═══ -->
      <div class="metrics-tier2">
        <div class="tier2-card">
          <div class="tier2-icon amber">!</div>
          <div class="tier2-body">
            <div class="tier2-label">{{t('dashOverdueLoans')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('dashOverdueLoansTip')}}</span></span></div>
            <div class="tier2-main">
              <span class="tier2-value amber">{{fmtR(stats.overdue_amount || 0)}}</span>
              <span class="tier2-badge amber">{{stats.overdue_count || 0}}/{{stats.total_applications}} ({{fmtPct((stats.overdue_count||0)/(stats.total_applications||1))}})</span>
            </div>
            <div class="tier2-detail">{{stats.overdue_highest_name ? t('dashOverdueHighest').replace('{name}', stats.overdue_highest_name).replace('{dpd}', stats.overdue_highest_dpd) : t('dashNoOverdueLoans')}}</div>
          </div>
        </div>
        <div class="tier2-card">
          <div class="tier2-icon danger">%</div>
          <div class="tier2-body">
            <div class="tier2-label">{{t('dashCollectionEfficiency')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('dashCollectionEfficiencyTip')}}</span></span></div>
            <div class="tier2-main">
              <span class="tier2-value" :class="(stats.collection_rate||0)>=0.9?'green':(stats.collection_rate||0)>=0.85?'amber':'danger'">{{fmtPct(stats.collection_rate || 0)}}</span>
              <span class="tier2-badge" :class="(stats.collection_rate||0)>=0.8?'green':'danger'">{{(stats.collection_rate||0)>=0.8 ? t('dashOnTarget') : t('dashBelowTarget')}}</span>
            </div>
            <div class="tier2-detail">{{t('dashAvgDaysToCollect')}}</div>
          </div>
        </div>
      </div>

      <!-- ═══ ROW 3: AI Portfolio Insight ═══ -->
      <div class="portfolio-insight-card" v-if="stats.portfolio_insight || stats.portfolio_insight_zh">
        <div class="portfolio-insight-header">
          <span class="portfolio-insight-icon">&#9679;</span>
          <h3>{{t('dashAIPortfolioInsight')}}</h3>
        </div>
        <div class="portfolio-insight-body">
          <p v-for="para in portfolioInsightText.split('\\n\\n')" :key="para">{{para}}</p>
        </div>
      </div>

      <!-- ═══ ROW 4: Charts ═══ -->
      <div class="dash-charts-row">
        <div class="chart-box"><h3>{{t('dashRiskDistribution')}} <span style="font-weight:400;color:#868e96">{{t('dashNumberOfApplications')}}</span></h3><canvas ref="riskChart"></canvas></div>
        <div class="chart-box"><h3>{{t('dashApplicationStatus')}} <span style="font-weight:400;color:#868e96">{{t('dashNumberOfApplications')}}</span></h3><canvas ref="statusChart"></canvas></div>
      </div>

    </div>
  `,
  setup() {
    const stats = ref({
      total_customers:0, total_applications:0, total_loan_amount:0, avg_risk_score:0,
      risk_distribution:{}, status_distribution:{}, recent_applications:[],
      project_total_limit:0, current_outstanding:0, remaining_capacity:0, utilization_ratio:0,
      utilization_warning:null, customer_risk_counts:{}, customers_near_limit:0,
      overdue_count:0, overdue_amount:0, overdue_highest_name:null, overdue_highest_dpd:0, collection_rate:0,
      total_accounts_receivable:0, total_accounts_payable:0,
    });
    const riskChart = ref(null);
    const statusChart = ref(null);

    onMounted(async () => {
      try {
        const res = await fetch(API + '/dashboard');
        if (!res.ok) throw new Error('Dashboard API returned ' + res.status);
        stats.value = await res.json();
      } catch (e) {
        console.error('Failed to load dashboard:', e);
        return;
      }
      await nextTick();
      const rd = stats.value.risk_distribution || {};
      new Chart(riskChart.value, {
        type: 'doughnut',
        data: {
          labels: [t('dashChartLow'), t('dashChartMedium'), t('dashChartHigh')],
          datasets: [{ data: [rd.low||0, rd.medium||0, rd.high||0], backgroundColor: ['#2b8a3e','#e67700','#c92a2a'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });
      const sd = stats.value.status_distribution || {};
      const statusColorMap = { pending: '#e67700', approved: '#2b8a3e', rejected: '#c92a2a' };
      const statusColors = Object.keys(sd).map(k => statusColorMap[k.toLowerCase()] || '#1864ab');
      new Chart(statusChart.value, {
        type: 'bar',
        data: {
          labels: Object.keys(sd).map(k => appStatusLabel(k)),
          datasets: [{ label: t('dashChartApplications'), data: Object.values(sd), backgroundColor: statusColors }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
      });
    });

    const portfolioInsightText = computed(() => {
      if (currentLang.value === 'zh' && stats.value.portfolio_insight_zh) return stats.value.portfolio_insight_zh;
      return stats.value.portfolio_insight || '';
    });

    return { stats, riskChart, statusChart, fmtR, fmtPct, riskLabel, appStatusLabel, portfolioInsightText, t };
  }
};

// ══════════════════════════ Customers Page ══════════════════════════
const CustomersPage = {
  template: `
    <div>
      <div class="detail-header">
        <div>
          <h1>{{t('custTitle')}}</h1>
        </div>
        <button class="btn btn-primary" @click="showAdd=true">{{t('custNewCustomer')}}</button>
      </div>
      <div class="panel" style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>{{t('custThId')}}</th><th>{{t('custThName')}}</th><th>{{t('custThCityPort')}}</th><th>{{t('custThGrade')}}</th>
            <th>{{t('custThCreditLimit')}}</th><th>{{t('custThOutstanding')}}</th><th>{{t('custThUtilization')}}</th>
            <th>{{t('custThRiskScore')}}</th><th>{{t('custThEverOverdue')}}</th><th>{{t('custThActions')}}</th>
          </tr></thead>
          <tbody>
            <tr v-for="c in customers" :key="c.customer_id">
              <td>{{c.customer_id}}</td>
              <td>
                <strong>{{c.customer_name}}</strong>
                <span class="badge cust-status-inline" :class="c.customer_status">{{custStatusLabel(c.customer_status)}}</span>
              </td>
              <td>{{c.city_or_port || '-'}}</td>
              <td><span class="badge" :class="gradeColor(c.credit_grade)">{{c.credit_grade || '-'}}</span></td>
              <td>{{fmtR(c.total_credit_limit)}}</td>
              <td>{{fmtR(c.current_outstanding_amount)}}</td>
              <td :style="{color: c.credit_utilization > 0.7 ? '#c92a2a' : c.credit_utilization > 0.5 ? '#e67700' : '', fontWeight: c.credit_utilization > 0.5 ? '600' : ''}">{{fmtPct(c.credit_utilization)}}</td>
              <td>
                <span v-if="c.current_risk_level" class="badge" :class="c.current_risk_level">{{c.current_risk_score ?? '-'}} · {{riskLabel(c.current_risk_level)}}</span>
                <span v-else style="color:#adb5bd">-</span>
              </td>
              <td style="text-align:center">
                <span v-if="c.ever_overdue" class="overdue-dot red" :title="t('custOverdueTitleYes')"></span>
                <span v-else class="overdue-dot green" :title="t('custOverdueTitleNo')"></span>
              </td>
              <td><router-link :to="'/customers/'+c.customer_id" class="btn btn-primary btn-sm">{{t('custDetail')}}</router-link></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Customer Modal -->
      <div v-if="showAdd" class="modal-overlay" @click.self="showAdd=false">
        <div class="modal">
          <h3>{{t('custModalTitle')}}</h3>
          <div class="form-grid">
            <div class="form-group"><label>{{t('custLabelName')}}</label><input v-model="form.customer_name"></div>
            <div class="form-group"><label>{{t('custLabelCityPortType')}}</label>
              <select v-model="form.city_or_port_type"><option value="city">{{t('custOptionCity')}}</option><option value="port">{{t('custOptionPort')}}</option></select>
            </div>
            <div class="form-group"><label>{{t('custLabelCityPort')}}</label>
              <select v-model="form.city_or_port">
                <option v-for="o in (form.city_or_port_type==='port'?ports:cities)" :value="o">{{o}}</option>
              </select>
            </div>
            <div class="form-group"><label>{{t('custLabelIndustry')}}</label>
              <select v-model="form.industry_type">
                <option value="auto_parts_wholesale">{{t('custOptWholesale')}}</option>
                <option value="auto_parts_retail">{{t('custOptRetail')}}</option>
                <option value="auto_repair">{{t('custOptRepair')}}</option>
                <option value="vehicle_dealer">{{t('custOptDealer')}}</option>
              </select>
            </div>
            <div class="form-group"><label>{{t('custLabelYears')}}</label><input type="number" v-model.number="form.years_in_auto_parts"></div>
            <div class="form-group"><label>{{t('custLabelCoopMonths')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('custCoopMonthsTip')}}</span></span></label><input type="number" v-model.number="form.cooperation_months"></div>
            <div class="form-group"><label>{{t('custLabelHistoricalOrder')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('custHistoricalOrderTip')}}</span></span></label><input type="number" v-model.number="form.total_historical_order_amount"></div>
            <div class="form-group"><label>{{t('custLabelContactName')}}</label><input v-model="form.contact_name"></div>
            <div class="form-group"><label>{{t('custLabelContactPhone')}}</label><input v-model="form.contact_phone"></div>
            <div class="form-group"><label>{{t('custLabelKeyCustomer')}}</label><select v-model="form.is_key_customer"><option :value="true">{{t('custOptionYes')}}</option><option :value="false">{{t('custOptionNo')}}</option></select></div>
            <div class="form-group"><label>{{t('custLabelCreditGrade')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('custCreditGradeTip')}}</span></span></label>
              <select v-model="form.credit_grade">
                <option value="A">{{t('gradeA')}}</option><option value="B">{{t('gradeB')}}</option><option value="C">{{t('gradeC')}}</option><option value="D">{{t('gradeD')}}</option>
              </select>
            </div>
          </div>
          <p class="form-hint">{{t('custAutoGenHint')}}</p>
          <div style="text-align:right;margin-top:16px">
            <button class="btn" @click="showAdd=false" style="background:#e9ecef">{{t('btnCancel')}}</button>
            <button class="btn btn-primary" @click="addCustomer">{{t('btnSave')}}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const customers = ref([]);
    const showAdd = ref(false);
    const cities = ['Johannesburg','Pretoria','Cape Town','Durban','Port Elizabeth','Bloemfontein'];
    const ports = ['Durban Port','Cape Town Port','Port Elizabeth Port','Richards Bay Port'];
    const form = reactive({
      customer_name:'', city_or_port_type:'city', city_or_port:'Johannesburg',
      industry_type:'auto_parts_wholesale', years_in_auto_parts:0, cooperation_months:0,
      is_key_customer:false, total_historical_order_amount:0, contact_name:'', contact_phone:'',
      credit_grade:'B'
    });

    const load = async () => { customers.value = await (await fetch(API+'/customers')).json(); };
    onMounted(() => {
      load();
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') showAdd.value = false; });
    });

    const addCustomer = async () => {
      try {
        const payload = { ...form, country: 'South Africa' };
        const res = await fetch(API+'/customers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(t('custFailedCreate') + (err.detail || t('custUnknownError')));
          return;
        }
        showAdd.value = false;
        await load();
      } catch (e) {
        alert(t('custNetworkError') + e.message);
      }
    };

    return { customers, showAdd, form, cities, ports, addCustomer, fmtR, fmtPct, riskLabel, custStatusLabel, gradeColor, t };
  }
};

// ══════════════════════════ Customer Detail Page ══════════════════════════
const CustomerDetailPage = {
  template: `
    <div v-if="detail">
      <div class="detail-header">
        <div>
          <h1>{{detail.customer.customer_name}}</h1>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            <span class="badge" :class="detail.customer.customer_status">{{custStatusLabel(detail.customer.customer_status)}}</span>
            <span v-if="detail.customer.is_key_customer" class="badge active">{{t('cdKeyCustomer')}}</span>
            <span v-if="detail.current_risk_level" class="badge" :class="detail.current_risk_level">{{riskLabel(detail.current_risk_level)}}</span>
            <span class="badge" :class="gradeColor(detail.customer.credit_grade)">{{t('cdGradeLabel').replace('{0}', detail.customer.credit_grade || '-')}}</span>
          </div>
        </div>
        <router-link to="/customers" class="btn" style="background:#e9ecef">{{t('cdBack')}}</router-link>
      </div>

      <!-- Blocked/Watchlist status messages -->
      <div v-if="detail.customer.customer_status==='suspended'" class="warning-banner danger">
        {{t('cdSuspendedBanner')}}
      </div>
      <div v-if="detail.customer.customer_status==='watchlist'" class="watchlist-message">
        {{t('cdWatchlistBanner')}}
      </div>
      <div v-if="detail.utilization_warning" class="warning-banner">
        {{detail.utilization_warning}}
      </div>

      <!-- Customer Profile (always visible, above tabs) -->
      <h3 class="lifecycle-heading">{{t('cdCustomerProfile')}}</h3>
      <div class="panel">
        <div class="info-grid">
          <div class="info-item"><div class="info-label">{{t('cdCustomerId')}}</div><div class="info-value">{{detail.customer.customer_id}}</div></div>
          <div class="info-item"><div class="info-label">{{t('cdCountry')}}</div><div class="info-value">{{detail.customer.country}}</div></div>
          <div class="info-item"><div class="info-label">{{t('cdLocation')}}</div><div class="info-value">{{detail.customer.city_or_port}} ({{detail.customer.city_or_port_type}})</div></div>
          <div class="info-item"><div class="info-label">{{t('cdIndustry')}}</div><div class="info-value">{{industryLabel(detail.customer.industry_type)}}</div></div>
          <div class="info-item"><div class="info-label">{{t('cdYearsInAuto')}}</div><div class="info-value">{{detail.customer.years_in_auto_parts}}</div></div>
          <div class="info-item"><div class="info-label">{{t('cdCoopMonths')}}</div><div class="info-value">{{detail.customer.cooperation_months}}</div></div>
          <div class="info-item"><div class="info-label">{{t('cdHistoricalOrders')}}</div><div class="info-value">{{fmtR(detail.customer.total_historical_order_amount)}}</div></div>
          <div class="info-item"><div class="info-label">{{t('cdInternalCreditGrade')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdInternalCreditGradeTip')}}</span></span></div><div class="info-value"><span class="badge" :class="gradeColor(detail.customer.credit_grade)">{{detail.customer.credit_grade || '-'}}</span></div></div>
          <div class="info-item"><div class="info-label">{{t('cdContact')}}</div><div class="info-value">{{detail.customer.contact_name}} {{detail.customer.contact_phone}}</div></div>
        </div>
      </div>

      <!-- Credit Exposure Card -->
      <div class="credit-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:16px;font-weight:600">{{t('cdCreditExposure')}}</div>
          <div style="font-size:13px;opacity:.7">ID: {{detail.customer.customer_id}}</div>
        </div>
        <div class="cc-row">
          <div><div class="cc-label">{{t('cdTotalCreditLimit')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdTotalCreditLimitTip')}}</span></span></div><div class="cc-value">{{fmtR(detail.customer.total_credit_limit)}}</div></div>
          <div><div class="cc-label">{{t('cdTotalDisbursed')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdTotalDisbursedTip')}}</span></span></div><div class="cc-value">{{fmtR(detail.customer.total_disbursed_amount)}}</div></div>
          <div><div class="cc-label">{{t('cdCurrentOutstanding')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdCurrentOutstandingTip')}}</span></span></div><div class="cc-value">{{fmtR(detail.customer.current_outstanding_amount)}}</div></div>
        </div>
        <div style="margin-top:12px">
          <div class="cc-label">{{t('cdUtilization')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdUtilizationTip')}}</span></span>: {{fmtPct(detail.credit_utilization)}}</div>
          <div class="progress-bar"><div class="progress-fill" :class="{warning: detail.credit_utilization > 0.5, danger: detail.credit_utilization > 0.8}" :style="{width: Math.min(detail.credit_utilization*100,100)+'%'}"></div></div>
        </div>
      </div>

      <!-- Application Summary & Risk (always visible, below Credit Exposure) -->
      <h3 class="lifecycle-heading">{{t('cdAppSummaryRisk')}}</h3>
      <div class="panel">
        <div class="info-grid">
          <div class="info-item"><div class="info-label">{{t('cdTotalApplications')}}</div><div class="info-value">{{detail.total_application_count}}</div></div>
          <div class="info-item"><div class="info-label">{{t('cdTotalAppAmount')}}</div><div class="info-value">{{fmtR(detail.total_application_amount)}}</div></div>
          <div class="info-item"><div class="info-label">{{t('cdCurrentRiskLevel')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdCurrentRiskLevelTip')}}</span></span></div><div class="info-value"><span v-if="detail.current_risk_level" class="badge" :class="detail.current_risk_level">{{riskLabel(detail.current_risk_level)}}</span><span v-else>-</span></div></div>
          <div class="info-item"><div class="info-label">{{t('cdRiskScore')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdRiskScoreTip')}}</span></span></div><div class="info-value">{{detail.current_risk_score ?? '-'}} / 100</div></div>
        </div>
      </div>

      <!-- Main Tabs: Pre-loan / In-loan / Post-loan -->
      <div class="tabs">
        <div class="tab" :class="{active: mainTab==='pre'}" @click="mainTab='pre'">{{t('cdTabPreLoan')}}</div>
        <div class="tab" :class="{active: mainTab==='in'}" @click="mainTab='in'">{{t('cdTabInLoan')}}</div>
        <div class="tab" :class="{active: mainTab==='post'}" @click="mainTab='post'">{{t('cdTabPostLoan')}}</div>
      </div>

      <!-- ═══ PRE-LOAN ASSESSMENT TAB ═══ -->
      <div v-if="mainTab==='pre'">

        <!-- Pending Applications (awaiting approval) -->
        <div v-if="pendingApps.length">
          <h3 class="lifecycle-heading">{{t('cdPendingApps')}}</h3>
          <div v-for="ad in pendingApps" :key="ad.application.application_id" :id="'app-'+ad.application.application_id" class="panel">

            <!-- Approval Decision — at the very top -->
            <div v-if="ad.application.application_status==='pending'" class="approval-decision-block" style="margin-bottom:20px">
              <h3 style="font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:4px">{{t('cdApprovalDecision')}}</h3>
              <p style="font-size:12px;color:#946800;margin-bottom:12px" v-html="t('cdApprovalDesc')"></p>
              <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
                <div class="form-group" style="margin:0;flex:0 0 140px">
                  <label>{{t('cdDecision')}}</label>
                  <select v-model="overrideForm[ad.application.application_id]">
                    <option value="pass">{{t('cdApprove')}}</option>
                    <option value="reject">{{t('cdReject')}}</option>
                  </select>
                </div>
                <div class="form-group" style="margin:0;flex:1">
                  <label>{{t('cdReason')}}</label>
                  <input v-model="overrideReason[ad.application.application_id]" :placeholder="t('cdReasonPlaceholder')">
                </div>
                <button class="btn btn-success" :disabled="saving[ad.application.application_id]" @click="doOverride(ad.application.application_id)">{{saving[ad.application.application_id] ? t('cdSubmitting') : t('cdSubmitDecision')}}</button>
              </div>
            </div>

            <div class="detail-header" style="margin-bottom:12px">
              <h2>{{t('cdApplication').replace('{0}', ad.application.application_id)}}</h2>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="badge" :class="ad.application.application_status">{{appStatusLabel(ad.application.application_status)}}</span>
                <span v-if="ad.application.manual_review_required" class="badge escalated-flag">{{t('cdEscalated')}}</span>
                <span v-if="ad.application.manual_decision" class="badge" :class="{approved: ad.application.manual_decision==='pass', rejected: ad.application.manual_decision==='reject'}">
                  {{t('cdDecisionLabel').replace('{0}', ad.application.manual_decision === 'pass' ? t('cdDecisionApproved') : ad.application.manual_decision === 'reject' ? t('cdDecisionRejected') : ad.application.manual_decision)}}
                </span>
              </div>
            </div>

            <!-- Application Info -->
            <div class="info-grid" style="margin-bottom:20px">
              <div class="info-item"><div class="info-label">{{t('cdDate')}}</div><div class="info-value">{{ad.application.application_date}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdContractAmount')}}</div><div class="info-value">{{fmtR(ad.application.contract_amount)}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdLoanRatio')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdLoanRatioTip')}}</span></span></div><div class="info-value loan-ratio-display">{{ad.application.loan_ratio != null ? fmtPct(ad.application.loan_ratio) : '-'}}</div></div>
              <div class="info-item">
                <div class="info-label">{{t('cdLoanAmount')}}</div>
                <div class="info-value">{{fmtR(ad.application.requested_loan_amount)}}
                  <span v-if="ad.ai_output && isLoanOutOfBand(ad.application.requested_loan_amount, ad.ai_output.recommended_loan_band)" class="mismatch-tag" :title="t('cdOutsideBandTip')">{{t('cdOutsideBand')}}</span>
                </div>
              </div>
              <div class="info-item"><div class="info-label">{{t('cdDownPayment')}}</div><div class="info-value">{{fmtR(ad.application.down_payment_amount)}}</div></div>
              <div class="info-item">
                <div class="info-label">{{t('cdLoanTerm')}}</div>
                <div class="info-value">{{termLabel(ad.application.loan_term_months)}}
                  <span v-if="ad.ai_output && isTermMismatch(ad.application.loan_term_months, ad.ai_output.recommended_term)" class="mismatch-tag" :title="t('cdTermMismatchTip')">{{t('cdTermMismatch')}}</span>
                </div>
              </div>
              <div class="info-item"><div class="info-label">{{t('cdUseOfFunds')}}</div><div class="info-value">{{fundsLabel(ad.application.use_of_funds)}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdReceivableStatus')}}</div><div class="info-value"><span class="badge" :class="receivableColor(ad.application.receivable_status)">{{receivableLabel(ad.application.receivable_status)}}</span></div></div>
            </div>

            <!-- Risk Assessment (inline, no sub-tabs) -->
            <div v-if="ad.ai_output">
              <h4 class="lifecycle-subheading">{{t('cdRiskAssessment')}}</h4>
              <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px">
                <div style="text-align:center">
                  <div style="font-size:48px;font-weight:700" :class="riskColor(ad.ai_output.risk_level)">{{ad.ai_output.total_risk_score}}</div>
                  <span class="badge" :class="ad.ai_output.risk_level" style="font-size:14px">{{riskLabel(ad.ai_output.risk_level)}}</span>
                </div>
                <div style="flex:1">
                  <div class="score-bar-group">
                    <div class="score-bar-item" v-for="dim in scoreDims(ad.ai_output)" :key="dim.label">
                      <div class="score-label"><span>{{dim.label}} <span v-if="dim.tip" class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{dim.tip}}</span></span></span><span>{{dim.score}}/25</span></div>
                      <div class="score-bar-track"><div class="score-bar-fill" :class="dim.score>=20?'green':dim.score>=12?'orange':'red'" :style="{width:(dim.score/25*100)+'%'}"></div></div>
                    </div>
                  </div>
                </div>
              </div>

              <h4 style="font-size:14px;margin-bottom:8px">{{t('cdAIRiskSummary')}}</h4>
              <div class="ai-box" :class="{warning:ad.ai_output.risk_level==='medium',danger:ad.ai_output.risk_level==='high'}">{{aiText(ad.ai_output, 'ai_risk_summary')}}</div>

              <h4 style="font-size:14px;margin-bottom:8px">{{t('cdAICreditRec')}}</h4>
              <div class="ai-box">{{aiText(ad.ai_output, 'ai_recommendation')}}</div>

              <div class="info-grid" style="margin-bottom:16px">
                <div class="info-item"><div class="info-label">{{t('cdRecLoanBand')}}</div><div class="info-value">{{ad.ai_output.recommended_loan_band}}</div></div>
                <div class="info-item"><div class="info-label">{{t('cdRecTerm')}}</div><div class="info-value">{{ad.ai_output.recommended_term}}</div></div>
                <div class="info-item"><div class="info-label">{{t('cdRecDownPayment')}}</div><div class="info-value">{{ad.ai_output.recommended_down_payment_ratio}}</div></div>
              </div>

              <div v-if="ad.ai_output.anomaly_flags && ad.ai_output.anomaly_flags.length">
                <h4 style="font-size:14px;margin-bottom:8px">{{t('cdAnomalyFlags')}}</h4>
                <ul class="anomaly-list"><li v-for="f in ad.ai_output.anomaly_flags" :key="f.en || f">{{typeof f === 'object' ? (currentLang === 'zh' ? f.zh : f.en) : f}}</li></ul>
              </div>

              <details style="margin-top:12px">
                <summary style="cursor:pointer;font-size:13px;color:#868e96">{{t('cdShowExplanation')}}</summary>
                <div class="ai-box" style="margin-top:8px">{{aiText(ad.ai_output, 'ai_explanation')}}</div>
              </details>
            </div>
            <div v-else>
              <p style="color:#868e96;margin-bottom:12px">{{t('cdAINotGenerated')}}</p>
              <button class="btn btn-primary" :disabled="saving[ad.application.application_id]" @click="generateAI(ad.application.application_id)">{{saving[ad.application.application_id] ? t('cdGenerating') : t('cdGenerateAI')}}</button>
            </div>
          </div>
        </div>

        <!-- No pending apps and no AI — guide the user -->
        <div v-if="!pendingApps.length && !latestAI" class="panel" style="text-align:center;padding:40px">
          <p style="color:#868e96;font-size:14px;margin-bottom:12px">{{t('cdNoPendingApps')}}</p>
          <router-link to="/applications" class="btn btn-primary">{{t('cdCreateNewApp')}}</router-link>
        </div>

        <!-- Latest AI Assessment (customer-level summary when no pending apps) -->
        <div v-if="!pendingApps.length && latestAI">
          <h3 class="lifecycle-heading">{{t('cdAISummaryAndRec')}}</h3>
          <div class="panel">
            <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px">
              <div style="text-align:center">
                <div style="font-size:48px;font-weight:700" :class="riskColor(latestAI.risk_level)">{{latestAI.total_risk_score}}</div>
                <span class="badge" :class="latestAI.risk_level" style="font-size:14px">{{riskLabel(latestAI.risk_level)}}</span>
              </div>
              <div style="flex:1">
                <div class="score-bar-group">
                  <div class="score-bar-item" v-for="dim in scoreDims(latestAI)" :key="dim.label">
                    <div class="score-label"><span>{{dim.label}}</span><span>{{dim.score}}/25</span></div>
                    <div class="score-bar-track"><div class="score-bar-fill" :class="dim.score>=20?'green':dim.score>=12?'orange':'red'" :style="{width:(dim.score/25*100)+'%'}"></div></div>
                  </div>
                </div>
              </div>
            </div>
            <h4 style="font-size:14px;margin-bottom:8px">{{t('cdAIRiskSummary')}}</h4>
            <div class="ai-box" :class="{warning:latestAI.risk_level==='medium',danger:latestAI.risk_level==='high'}">{{aiText(latestAI, 'ai_risk_summary')}}</div>
            <h4 style="font-size:14px;margin-bottom:8px">{{t('cdAICreditRec')}}</h4>
            <div class="ai-box">{{aiText(latestAI, 'ai_recommendation')}}</div>
          </div>
        </div>
      </div>

      <!-- ═══ IN-LOAN MONITORING TAB ═══ -->
      <div v-if="mainTab==='in'">
        <p class="lifecycle-subheading">{{t('cdInLoanDesc')}}</p>
        <div v-if="inLoanApps.length === 0" class="panel"><p style="color:#868e96">{{t('cdNoActiveLoans')}}</p></div>
        <div v-for="ad in inLoanApps" :key="ad.application.application_id" :id="'app-'+ad.application.application_id" class="panel">
          <div class="detail-header" style="margin-bottom:12px">
            <h2>{{t('cdApplication').replace('{0}', ad.application.application_id)}}</h2>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="badge approved">{{t('cdApproved')}}</span>
              <span class="badge" :class="disbursementColor(ad.application.disbursement_status)">{{disbursementLabel(ad.application.disbursement_status)}}</span>
              <span class="badge" :class="receivableColor(ad.application.receivable_status)">{{receivableLabel(ad.application.receivable_status)}}</span>
              <span v-if="ad.application.days_past_due > 0" class="badge high">{{t('cdOverdueDays').replace('{0}', ad.application.days_past_due)}}</span>
            </div>
          </div>

          <!-- Sub-tabs: Info / Logistics & Pickup -->
          <div class="tabs">
            <div class="tab" :class="{active: appTab[ad.application.application_id]==='info'}" @click="appTab[ad.application.application_id]='info'">{{t('cdTabAppInfo')}}</div>
            <div class="tab" :class="{active: appTab[ad.application.application_id]==='logistics'}" @click="appTab[ad.application.application_id]='logistics'">{{t('cdTabLogistics')}}</div>
          </div>

          <!-- Application Info -->
          <div v-if="appTab[ad.application.application_id]==='info'">
            <div class="info-grid">
              <div class="info-item"><div class="info-label">{{t('cdDate')}}</div><div class="info-value">{{ad.application.application_date}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdContractAmount')}}</div><div class="info-value">{{fmtR(ad.application.contract_amount)}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdLoanRatio')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdLoanRatioTip')}}</span></span></div><div class="info-value loan-ratio-display">{{ad.application.loan_ratio != null ? fmtPct(ad.application.loan_ratio) : '-'}}</div></div>
              <div class="info-item">
                <div class="info-label">{{t('cdLoanAmount')}}</div>
                <div class="info-value">{{fmtR(ad.application.requested_loan_amount)}}
                  <span v-if="ad.ai_output && isLoanOutOfBand(ad.application.requested_loan_amount, ad.ai_output.recommended_loan_band)" class="mismatch-tag" :title="t('cdOutsideBandTip')">{{t('cdOutsideBand')}}</span>
                </div>
              </div>
              <div class="info-item"><div class="info-label">{{t('cdDownPayment')}}</div><div class="info-value">{{fmtR(ad.application.down_payment_amount)}}</div></div>
              <div class="info-item">
                <div class="info-label">{{t('cdLoanTerm')}}</div>
                <div class="info-value">{{termLabel(ad.application.loan_term_months)}}
                  <span v-if="ad.ai_output && isTermMismatch(ad.application.loan_term_months, ad.ai_output.recommended_term)" class="mismatch-tag" :title="t('cdTermMismatchTip')">{{t('cdTermMismatch')}}</span>
                </div>
              </div>
              <div class="info-item"><div class="info-label">{{t('cdOverdueDaysLabel')}}</div><div class="info-value" :style="{color: ad.application.days_past_due > 0 ? '#c92a2a' : '#2b8a3e', fontWeight: 600}">{{ad.application.days_past_due || 0}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdUseOfFunds')}}</div><div class="info-value">{{fundsLabel(ad.application.use_of_funds)}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdDisbursement')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdDisbursementTip')}}</span></span></div><div class="info-value"><span class="badge" :class="disbursementColor(ad.application.disbursement_status)">{{disbursementLabel(ad.application.disbursement_status)}}</span></div></div>
              <div class="info-item"><div class="info-label">{{t('cdReceivableStatus')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdReceivableStatusTip')}}</span></span></div><div class="info-value"><span class="badge" :class="receivableColor(ad.application.receivable_status)">{{receivableLabel(ad.application.receivable_status)}}</span></div></div>
            </div>
          </div>

          <!-- Trade Logistics & Pickup Records -->
          <div v-if="appTab[ad.application.application_id]==='logistics'">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <h4 class="lifecycle-subheading" style="margin-bottom:0">{{t('cdTradeLogistics')}}</h4>
              <button class="btn btn-sm btn-primary" @click="toggleLogiForm(ad.application.application_id)">{{logiFormOpen[ad.application.application_id] ? t('btnCancel') : (ad.trade_logistics ? t('cdEditLogistics') : t('cdAddLogistics'))}}</button>
            </div>

            <!-- Logistics Add/Edit Form -->
            <div v-if="logiFormOpen[ad.application.application_id]" class="panel" style="background:#f8f9fa;margin-bottom:16px">
              <div class="form-grid">
                <div class="form-group"><label>{{t('cdETD')}}</label><input type="date" v-model="logiForm[ad.application.application_id].etd"></div>
                <div class="form-group"><label>{{t('cdETA')}}</label><input type="date" v-model="logiForm[ad.application.application_id].eta"></div>
                <div class="form-group"><label>{{t('cdActualArrival')}}</label><input type="date" v-model="logiForm[ad.application.application_id].actual_arrival_date"></div>
                <div class="form-group"><label>{{t('cdGoodsType')}}</label>
                  <select v-model="logiForm[ad.application.application_id].goods_type">
                    <option value="brake_parts">{{t('cdBrakeParts')}}</option><option value="engine_parts">{{t('cdEngineParts')}}</option>
                    <option value="body_parts">{{t('cdBodyParts')}}</option><option value="suspension_parts">{{t('cdSuspensionParts')}}</option>
                    <option value="mixed_parts">{{t('cdMixedParts')}}</option><option value="accessories">{{t('cdAccessories')}}</option>
                  </select>
                </div>
                <div class="form-group"><label>{{t('cdGoodsLiquidity')}}</label>
                  <select v-model="logiForm[ad.application.application_id].goods_liquidity_level">
                    <option value="high">{{t('cdLiquidityHigh')}}</option><option value="medium">{{t('cdLiquidityMedium')}}</option><option value="low">{{t('cdLiquidityLow')}}</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-success btn-sm" @click="saveLogi(ad.application.application_id)">{{t('cdSaveLogistics')}}</button>
            </div>

            <div v-if="ad.trade_logistics && !logiFormOpen[ad.application.application_id]" class="info-grid" style="margin-bottom:20px">
              <div class="info-item"><div class="info-label">{{t('cdETD')}}</div><div class="info-value">{{ad.trade_logistics.etd||'-'}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdETA')}}</div><div class="info-value">{{ad.trade_logistics.eta||'-'}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdActualArrival')}}</div><div class="info-value">{{ad.trade_logistics.actual_arrival_date||t('cdPending')}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdGoodsType')}}</div><div class="info-value">{{goodsTypeLabel(ad.trade_logistics.goods_type)}}</div></div>
              <div class="info-item"><div class="info-label">{{t('cdGoodsLiquidity')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdGoodsLiquidityTip')}}</span></span></div><div class="info-value">{{({high:t('cdLiquidityHigh'),medium:t('cdLiquidityMedium'),low:t('cdLiquidityLow')})[ad.trade_logistics.goods_liquidity_level] || '-'}}</div></div>
            </div>
            <p v-if="!ad.trade_logistics && !logiFormOpen[ad.application.application_id]" style="color:#868e96;margin-bottom:20px">{{t('cdNoLogistics')}}</p>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <h4 class="lifecycle-subheading" style="margin-bottom:0">{{t('cdPickupRecords')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdPickupRecordsTip')}}</span></span></h4>
              <button class="btn btn-sm btn-primary" @click="togglePickupForm(ad.application.application_id)">{{pickupFormOpen[ad.application.application_id] ? t('btnCancel') : t('cdAddPickup')}}</button>
            </div>

            <!-- Add Pickup Form -->
            <div v-if="pickupFormOpen[ad.application.application_id]" class="panel" style="background:#f8f9fa;margin-bottom:16px">
              <div class="form-grid">
                <div class="form-group"><label>{{t('cdPickupDate')}}</label><input type="date" v-model="pickupForm[ad.application.application_id].pickup_date"></div>
                <div class="form-group"><label>{{t('cdPercentage')}}</label><input type="number" min="0" max="100" v-model.number="pickupForm[ad.application.application_id].pickup_percentage"></div>
                <div class="form-group full"><label>{{t('cdNote')}}</label><input v-model="pickupForm[ad.application.application_id].note" :placeholder="t('cdNotePlaceholder')"></div>
              </div>
              <button class="btn btn-success btn-sm" @click="savePickup(ad.application.application_id)">{{t('cdSavePickupRecord')}}</button>
            </div>

            <div v-if="ad.pickup_records && ad.pickup_records.length">
              <table class="pickup-table">
                <thead><tr><th>{{t('cdDate')}}</th><th>{{t('cdPercentage')}}</th><th>{{t('cdNote')}}</th></tr></thead>
                <tbody>
                  <tr v-for="pr in ad.pickup_records" :key="pr.id">
                    <td>{{pr.pickup_date}}</td>
                    <td>{{pr.pickup_percentage}}%</td>
                    <td>{{pr.note||'-'}}</td>
                  </tr>
                </tbody>
              </table>
              <div v-if="ad.pickup_summary" class="info-grid" style="margin-top:16px">
                <div class="info-item"><div class="info-label">{{t('cdFirstPickup')}}</div><div class="info-value">{{ad.pickup_summary.first_pickup_date}}</div></div>
                <div class="info-item"><div class="info-label">{{t('cdNumberOfPickups')}}</div><div class="info-value">{{ad.pickup_summary.number_of_pickups}}</div></div>
                <div class="info-item"><div class="info-label">{{t('cdTotalCompletionDays')}}</div><div class="info-value">{{ad.pickup_summary.total_completion_days}}</div></div>
                <div class="info-item"><div class="info-label">{{t('cdDaysArrivalToPickup')}}</div><div class="info-value">{{ad.pickup_summary.days_from_arrival_to_first_pickup ?? '-'}}</div></div>
                <div class="info-item"><div class="info-label">{{t('cdPickupPattern')}}</div><div class="info-value">{{ad.pickup_summary.pickup_pattern_label}}</div></div>
              </div>
            </div>
            <p v-else-if="!pickupFormOpen[ad.application.application_id]" style="color:#868e96">{{t('cdNoPickupRecords')}}</p>
          </div>
        </div>
      </div>

      <!-- ═══ POST-LOAN & GOVERNANCE TAB ═══ -->
      <div v-if="mainTab==='post'">

        <!-- ── Post-loan Alerts ── -->
        <div v-if="postLoanAlerts.length" class="post-alert-card">
          <div class="post-alert-header">{{t('cdPostLoanAlerts').replace('{0}', postLoanAlerts.length)}}</div>
          <ul class="post-alert-list">
            <li v-for="(alert, i) in postLoanAlerts" :key="i" :class="'post-alert-' + alert.severity">{{alert.text}}</li>
          </ul>
        </div>

        <!-- ── Delinquency & Overdue History ── -->
        <h3 class="lifecycle-heading">{{t('cdDelinquencyHistory')}}
          <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('cdDelinquencyTip')}}</span></span>
        </h3>
        <div class="panel">
          <table v-if="overdueApps.length">
            <thead><tr><th>{{t('cdThApplication')}}</th><th>{{t('cdThLoanAmount')}}</th><th>{{t('cdThTerm')}}</th><th>{{t('cdThDPDSeverity')}}</th><th>{{t('cdThReceivable')}}</th><th>{{t('cdThRecovery')}}</th><th>{{t('cdThStatus')}}</th></tr></thead>
            <tbody>
              <tr v-for="ad in overdueApps" :key="ad.application.application_id">
                <td>{{ad.application.application_id}}</td>
                <td>{{fmtR(ad.application.requested_loan_amount)}}</td>
                <td>{{termLabel(ad.application.loan_term_months)}}</td>
                <td>
                  <span class="badge" :class="dpdSeverityClass(ad.application.days_past_due)">{{t('cdBuyerDPD').replace('{dpd}', ad.application.days_past_due).replace('{label}', dpdSeverityLabel(ad.application.days_past_due))}}</span>
                </td>
                <td><span class="badge" :class="receivableColor(ad.application.receivable_status)">{{receivableLabel(ad.application.receivable_status)}}</span></td>
                <td>{{ad.application.recovery_amount ? fmtR(ad.application.recovery_amount) : '-'}}</td>
                <td><span class="badge" :class="ad.application.application_status">{{appStatusLabel(ad.application.application_status)}}</span></td>
              </tr>
            </tbody>
          </table>
          <p v-else style="color:#868e96;font-size:13px">{{t('cdNoOverdueApps')}}</p>

          <!-- Batch actions for overdue -->
          <div v-if="overdueApps.some(ad => ad.application.days_past_due >= 30)" class="post-batch-bar">
            <span style="font-size:13px;color:#495057;font-weight:600">{{t('cdBatchActionsLabel')}}</span>
            <button class="btn btn-sm btn-outline" @click="batchAction('collection')">{{t('cdSendCollection')}}</button>
            <button class="btn btn-sm btn-outline btn-danger-outline" @click="batchAction('freeze')">{{t('cdFreezeCustomer')}}</button>
            <button class="btn btn-sm btn-outline" @click="batchAction('legal')">{{t('cdNotifyLegal')}}</button>
          </div>
        </div>

        <!-- ── Rejected / Declined Applications ── -->
        <h3 class="lifecycle-heading">{{t('cdRejectedApps')}}</h3>
        <div v-if="closedApps.length === 0" class="panel"><p style="color:#868e96;font-size:13px">{{t('cdNoRejectedApps')}}</p></div>
        <div v-for="ad in closedApps" :key="ad.application.application_id" :id="'app-'+ad.application.application_id" class="panel">
          <div class="detail-header" style="margin-bottom:12px">
            <h2>{{t('cdApplication').replace('{0}', ad.application.application_id)}}</h2>
            <span class="badge" :class="ad.application.application_status">{{appStatusLabel(ad.application.application_status)}}</span>
            <span v-if="ad.application.manual_review_required" class="badge escalated-flag">{{t('cdEscalated')}}</span>
          </div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">{{t('cdDate')}}</div><div class="info-value">{{ad.application.application_date}}</div></div>
            <div class="info-item"><div class="info-label">{{t('cdContractAmount')}}</div><div class="info-value">{{fmtR(ad.application.contract_amount)}}</div></div>
            <div class="info-item"><div class="info-label">{{t('cdLoanRatio')}}</div><div class="info-value">{{ad.application.loan_ratio != null ? fmtPct(ad.application.loan_ratio) : '-'}}</div></div>
            <div class="info-item"><div class="info-label">{{t('cdLoanAmount')}}</div><div class="info-value">{{fmtR(ad.application.requested_loan_amount)}}</div></div>
            <div class="info-item"><div class="info-label">{{t('cdLoanTerm')}}</div><div class="info-value">{{termLabel(ad.application.loan_term_months)}}</div></div>
            <div class="info-item"><div class="info-label">{{t('cdDecisionField')}}</div><div class="info-value">{{decisionLabel(ad.application.manual_decision)}}</div></div>
          </div>
          <div v-if="ad.ai_output" style="margin-top:12px">
            <div class="info-grid">
              <div class="info-item"><div class="info-label">{{t('cdRiskScore')}}</div><div class="info-value"><span class="badge" :class="ad.ai_output.risk_level">{{ad.ai_output.total_risk_score}} ({{riskLabel(ad.ai_output.risk_level)}})</span></div></div>
            </div>
          </div>

          <!-- Override history for this application -->
          <div v-if="ad.ai_output && ad.ai_output.override_flag" class="override-section" style="margin-top:12px;background:#f8f9fa;border:1px solid #dee2e6">
            <h4 style="color:#495057;font-size:13px">{{t('cdOverrideHistory')}}</h4>
            <p style="font-size:13px">{{t('cdOverrideHistoryText').replace('{risk}', riskLabel(ad.ai_output.risk_level)).replace('{decision}', decisionLabel(ad.application.manual_decision)).replace('{reason}', ad.ai_output.override_reason || '-')}}</p>
          </div>
        </div>

        <!-- ── Governance Notes ── -->
        <h3 class="lifecycle-heading">{{t('cdGovernanceNotes')}}</h3>
        <div v-if="governanceApps.length === 0" class="panel">
          <p style="color:#868e96;font-size:13px">{{t('cdNoGovernance')}}</p>
        </div>
        <div v-for="ad in governanceApps" :key="'gov-'+ad.application.application_id" class="panel gov-card" style="margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <strong>{{ad.application.application_id}}</strong>
            <span class="badge" :class="ad.application.application_status">{{appStatusLabel(ad.application.application_status)}}</span>
            <span class="badge" :class="ad.ai_output.risk_level">{{riskLabel(ad.ai_output.risk_level)}}</span>
            <span style="color:#868e96;font-size:12px">{{ad.ai_output.generated_at ? ad.ai_output.generated_at.split('T')[0] : ''}}</span>
          </div>
          <div class="info-grid" style="margin-bottom:10px">
            <div class="info-item"><div class="info-label">{{t('cdAIRiskScoreLabel')}}</div><div class="info-value">{{ad.ai_output.total_risk_score}}/100</div></div>
            <div class="info-item"><div class="info-label">{{t('cdHumanDecision')}}</div><div class="info-value" style="font-weight:600">{{decisionLabel(ad.application.manual_decision)}}</div></div>
          </div>
          <div class="gov-section">
            <div class="gov-label">{{t('cdOverrideReason')}}</div>
            <div class="gov-content">{{ad.ai_output.override_reason}}</div>
          </div>
          <div v-if="ad.ai_output.governance_follow_up" class="gov-section">
            <div class="gov-label">{{t('cdFollowUpActions')}}</div>
            <div class="gov-content">{{ad.ai_output.governance_follow_up}}</div>
          </div>
          <div v-if="ad.ai_output.governance_outcome" class="gov-section">
            <div class="gov-label">{{t('cdFinalOutcome')}}</div>
            <div class="gov-content">{{ad.ai_output.governance_outcome}}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="loadError" style="text-align:center;padding:60px">
      <p style="color:#c92a2a;font-size:14px;margin-bottom:12px">{{loadError}}</p>
      <button class="btn btn-primary" @click="retryLoad">{{t('cdRetry')}}</button>
    </div>
    <div v-else style="text-align:center;padding:60px;color:#868e96">{{t('cdLoading')}}</div>
  `,
  setup() {
    const route = VueRouter.useRoute();
    const detail = ref(null);
    const loadError = ref('');
    const saving = reactive({});
    const mainTab = ref('pre');
    const appTab = reactive({});
    const overrideForm = reactive({});
    const overrideReason = reactive({});
    const logiFormOpen = reactive({});
    const logiForm = reactive({});
    const pickupFormOpen = reactive({});
    const pickupForm = reactive({});

    const retryLoad = () => { loadError.value = ''; load(); };

    const load = async () => {
      try {
        const res = await fetch(API + '/customers/' + route.params.id + '/detail');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        detail.value = await res.json();
      } catch (e) {
        loadError.value = t('cdFailedToLoad') + e.message;
        return;
      }
      detail.value.applications.forEach(ad => {
        appTab[ad.application.application_id] = appTab[ad.application.application_id] || 'info';
        overrideForm[ad.application.application_id] = 'pass';
        overrideReason[ad.application.application_id] = '';
        if (!logiFormOpen[ad.application.application_id]) logiFormOpen[ad.application.application_id] = false;
        if (!pickupFormOpen[ad.application.application_id]) pickupFormOpen[ad.application.application_id] = false;
      });
    };
    onMounted(async () => {
      await load();
      const targetApp = route.query.app;
      if (targetApp && detail.value) {
        // Find which tab the application belongs to
        const ad = detail.value.applications.find(a => a.application.application_id === targetApp);
        if (ad) {
          if (ad.application.application_status === 'pending') mainTab.value = 'pre';
          else if (ad.application.application_status === 'approved') mainTab.value = 'in';
          else if (ad.application.application_status === 'rejected') mainTab.value = 'post';
          await nextTick();
          const el = document.getElementById('app-' + targetApp);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el.style.outline = '2px solid #1864ab';
            el.style.outlineOffset = '4px';
            setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 3000);
          }
        }
      }
    });

    const pendingApps = computed(() => {
      if (!detail.value) return [];
      return detail.value.applications.filter(ad =>
        ad.application.application_status === 'pending'
      );
    });

    const inLoanApps = computed(() => {
      if (!detail.value) return [];
      return detail.value.applications.filter(ad =>
        ad.application.application_status === 'approved'
      );
    });

    const closedApps = computed(() => {
      if (!detail.value) return [];
      return detail.value.applications.filter(ad =>
        ad.application.application_status === 'rejected'
      );
    });

    const overdueApps = computed(() => {
      if (!detail.value) return [];
      return detail.value.applications.filter(ad =>
        (ad.application.days_past_due || 0) > 0
      );
    });

    const governanceApps = computed(() => {
      if (!detail.value) return [];
      return detail.value.applications.filter(ad =>
        ad.ai_output && ad.ai_output.override_flag
      );
    });

    const postLoanAlerts = computed(() => {
      if (!detail.value) return [];
      const alerts = [];
      const apps = detail.value.applications;

      // DPD alerts
      for (const ad of apps) {
        const dpd = ad.application.days_past_due || 0;
        if (dpd >= 30) {
          alerts.push({ severity: 'critical', text: t('cdAlertDPDCritical').replace('{id}', ad.application.application_id).replace('{dpd}', dpd) });
        } else if (dpd >= 15) {
          alerts.push({ severity: 'warning', text: t('cdAlertDPDWarning').replace('{id}', ad.application.application_id).replace('{dpd}', dpd) });
        }
      }

      // Slow pickup on disbursed, active loans
      for (const ad of apps) {
        if (ad.application.disbursement_status === 'disbursed' && ad.application.receivable_status !== 'paid' && ad.pickup_summary) {
          const pattern = ad.pickup_summary.pickup_pattern_label || '';
          if (pattern.includes('slow') || pattern.includes('Long idle')) {
            alerts.push({ severity: 'warning', text: t('cdAlertSlowPickup').replace('{id}', ad.application.application_id) });
          }
          if (ad.pickup_summary.days_from_arrival_to_first_pickup != null && ad.pickup_summary.days_from_arrival_to_first_pickup > 14) {
            alerts.push({ severity: 'info', text: t('cdAlertDelayedPickup').replace('{id}', ad.application.application_id).replace('{days}', ad.pickup_summary.days_from_arrival_to_first_pickup) });
          }
        }
      }

      // Low liquidity goods on active loans
      for (const ad of apps) {
        if (ad.trade_logistics && ad.trade_logistics.goods_liquidity_level === 'low' && ad.application.disbursement_status === 'disbursed' && ad.application.receivable_status !== 'paid') {
          alerts.push({ severity: 'info', text: t('cdAlertLowLiquidity').replace('{id}', ad.application.application_id) });
        }
      }

      // Credit utilization
      const cust = detail.value.customer;
      if (cust.total_credit_limit > 0) {
        const util = (cust.current_outstanding_amount || 0) / cust.total_credit_limit;
        if (util >= 0.8) {
          alerts.push({ severity: 'warning', text: t('cdAlertCreditUtil').replace('{pct}', Math.round(util * 100)) });
        }
      }

      return alerts;
    });

    function dpdSeverityClass(dpd) {
      if (dpd >= 30) return 'dpd-critical';
      if (dpd >= 15) return 'dpd-warning';
      return 'dpd-mild';
    }
    function dpdSeverityLabel(dpd) {
      if (dpd >= 60) return t('cdDPDSevere');
      if (dpd >= 30) return t('cdDPDCritical');
      if (dpd >= 15) return t('cdDPDElevated');
      return t('cdDPDMild');
    }
    function batchAction(action) {
      const labels = { collection: t('cdSendCollection'), freeze: t('cdFreezeCustomer'), legal: t('cdNotifyLegal') };
      alert(t('cdBatchActionDemo').replace('{action}', labels[action] || action));
    }

    const latestAI = computed(() => {
      if (!detail.value) return null;
      for (const ad of detail.value.applications) {
        if (ad.ai_output) return ad.ai_output;
      }
      return null;
    });

    const scoreDims = (ao) => [
      { label: t('cdScoreStability'), score: ao.score_stability, tip: t('cdScoreStabilityTip') },
      { label: t('cdScoreRepayment'), score: ao.score_repayment, tip: t('cdScoreRepaymentTip') },
      { label: t('cdScoreStructure'), score: ao.score_structure, tip: t('cdScoreStructureTip') },
      { label: t('cdScoreLogistics'), score: ao.score_logistics, tip: t('cdScoreLogisticsTip') },
    ];

    const generateAI = async (appId) => {
      saving[appId] = true;
      try {
        const res = await fetch(API + '/ai-output/' + appId + '/generate', { method: 'POST' });
        if (!res.ok) { alert(t('cdFailedGenerateAI')); return; }
        await load();
      } finally { saving[appId] = false; }
    };

    const doOverride = async (appId) => {
      saving[appId] = true;
      try {
        const res = await fetch(API + '/ai-output/' + appId + '/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manual_decision: overrideForm[appId], override_reason: overrideReason[appId] })
        });
        if (!res.ok) { alert(t('cdFailedSubmitDecision')); return; }
        await load();
      } finally { saving[appId] = false; }
    };

    const toggleLogiForm = (appId) => {
      logiFormOpen[appId] = !logiFormOpen[appId];
      if (logiFormOpen[appId]) {
        const ad = detail.value.applications.find(a => a.application.application_id === appId);
        const tl = ad && ad.trade_logistics;
        logiForm[appId] = {
          etd: tl ? tl.etd || '' : '',
          eta: tl ? tl.eta || '' : '',
          actual_arrival_date: tl ? tl.actual_arrival_date || '' : '',
          goods_type: tl ? tl.goods_type || 'mixed_parts' : 'mixed_parts',
          goods_liquidity_level: tl ? tl.goods_liquidity_level || 'medium' : 'medium',
        };
      }
    };

    const saveLogi = async (appId) => {
      const f = logiForm[appId];
      const ad = detail.value.applications.find(a => a.application.application_id === appId);
      const payload = { ...f, application_id: appId };
      // Clean empty date strings
      if (!payload.etd) payload.etd = null;
      if (!payload.eta) payload.eta = null;
      if (!payload.actual_arrival_date) payload.actual_arrival_date = null;
      if (ad && ad.trade_logistics) {
        await fetch(API + '/trade-logistics/' + appId, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      } else {
        await fetch(API + '/trade-logistics', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      }
      logiFormOpen[appId] = false;
      await load();
    };

    const togglePickupForm = (appId) => {
      pickupFormOpen[appId] = !pickupFormOpen[appId];
      if (pickupFormOpen[appId]) {
        pickupForm[appId] = { pickup_date: new Date().toISOString().slice(0,10), pickup_percentage: 0, note: '' };
      }
    };

    const savePickup = async (appId) => {
      const f = pickupForm[appId];
      await fetch(API + '/pickup-records', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ application_id: appId, ...f })
      });
      pickupFormOpen[appId] = false;
      await load();
    };

    return { detail, loadError, saving, retryLoad, mainTab, appTab, overrideForm, overrideReason,
             logiFormOpen, logiForm, pickupFormOpen, pickupForm,
             pendingApps, inLoanApps, closedApps, overdueApps, governanceApps, postLoanAlerts, latestAI,
             dpdSeverityClass, dpdSeverityLabel, batchAction,
             scoreDims, generateAI, doOverride,
             toggleLogiForm, saveLogi, togglePickupForm, savePickup,
             fmtR, fmtPct, riskColor, riskLabel, custStatusLabel, termLabel, gradeColor,
             isLoanOutOfBand, isTermMismatch,
             receivableLabel, receivableColor, disbursementLabel, disbursementColor,
             appStatusLabel, fundsLabel, industryLabel, goodsTypeLabel, decisionLabel, aiText, currentLang, t };
  }
};

// ══════════════════════════ All Applications Page ══════════════════════════
const AllApplicationsPage = {
  template: `
    <div>
      <div class="detail-header">
        <div>
          <h1>{{t('appTitle')}}</h1>
        </div>
        <button class="btn btn-primary" @click="openAdd">{{t('appNewApplication')}}</button>
      </div>

      <!-- Status filter -->
      <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span style="font-size:13px;font-weight:600;color:#495057">{{t('appFilterLabel')}}</span>
        <button v-for="s in statuses" :key="s.value" class="btn btn-sm" :class="filter===s.value ? 'btn-primary' : ''" :style="filter!==s.value ? 'background:#e9ecef;color:#495057' : ''" @click="filter=s.value">{{s.label}}</button>
      </div>

      <div class="panel" style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>{{t('appThId')}}</th><th>{{t('appThCustomer')}}</th><th>{{t('appThLoan')}}</th><th>{{t('appThRatio')}}</th>
            <th>{{t('appThDate')}}</th><th>{{t('appThTerm')}}</th><th>{{t('appThMaturity')}}</th><th>{{t('appThStatus')}}</th><th>{{t('appThDisbursement')}}</th><th>{{t('appThRisk')}}</th><th>{{t('appThOverdue')}}</th><th>{{t('appThActions')}}</th>
          </tr></thead>
          <tbody>
            <tr v-for="a in filtered" :key="a.application_id">
              <td>{{a.application_id}}</td>
              <td>{{a.customer_name || a.customer_id}}</td>
              <td>{{fmtR(a.requested_loan_amount)}}</td>
              <td>{{a.loan_ratio != null ? fmtPct(a.loan_ratio) : '-'}}</td>
              <td>{{a.application_date}}</td>
              <td>{{a.loan_term_months ? t('appMonths').replace('{0}', a.loan_term_months) : '-'}}</td>
              <td>{{a.maturity_date || '-'}}</td>
              <td><span class="badge" :class="a.application_status">{{appStatusLabel(a.application_status)}}</span><span v-if="a.manual_review_required" class="badge escalated-flag" style="margin-left:4px">{{t('cdEscalated')}}</span></td>
              <td>
                <span v-if="a.application_status==='approved'" class="badge" :class="a.disbursement_status==='disbursed' ? 'disbursed' : 'not-disbursed'">{{disbursementLabel(a.disbursement_status)}}</span>
                <span v-else style="color:#adb5bd">-</span>
              </td>
              <td><span v-if="a.risk_level" class="badge" :class="a.risk_level">{{a.risk_score ?? '-'}} · {{riskLabel(a.risk_level)}}</span><span v-else style="color:#adb5bd">-</span></td>
              <td :style="{color: (a.days_past_due||0) > 0 ? '#c92a2a' : '', fontWeight: (a.days_past_due||0) > 0 ? '600' : ''}">{{a.days_past_due || 0}}</td>
              <td><router-link :to="'/customers/'+a.customer_id+'?app='+a.application_id" class="btn btn-primary btn-sm">{{t('custDetail')}}</router-link></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!filtered.length" style="color:#868e96;font-size:13px;margin-top:12px">{{t('appNoMatch')}}</p>
      </div>

      <!-- New Application Modal -->
      <div v-if="showAdd" class="modal-overlay" @click.self="showAdd=false">
        <div class="modal">
          <h3>{{t('appModalTitle')}}</h3>

          <div v-if="selectedCustomer && selectedCustomer.customer_status==='suspended'" class="warning-banner danger" style="margin-bottom:12px">
            {{t('appHighRiskWarning')}}
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>{{t('appLabelCustomer')}}</label>
              <select v-model="addForm.customer_id" @change="onCustomerChange">
                <option value="">{{t('appSelectCustomer')}}</option>
                <option v-for="c in customers" :key="c.customer_id" :value="c.customer_id">{{c.customer_id}} - {{c.customer_name}}</option>
              </select>
            </div>
            <div class="form-group"><label>{{t('appLabelDate')}}</label><input type="date" v-model="addForm.application_date"></div>
            <div class="form-group"><label>{{t('appLabelContractAmount')}}</label><input type="number" v-model.number="addForm.contract_amount"></div>
            <div class="form-group"><label>{{t('appLabelLoanAmount')}}</label><input type="number" v-model.number="addForm.requested_loan_amount"></div>
            <div class="form-group"><label>{{t('appLabelDownPayment')}}</label><input type="number" v-model.number="addForm.down_payment_amount"></div>
            <div class="form-group">
              <label>{{t('appLabelLoanTerm')}}</label>
              <select v-model="addForm.loan_term_months">
                <option :value="3">{{t('term3')}}</option>
                <option :value="6">{{t('term6')}}</option>
              </select>
            </div>
            <div class="form-group"><label>{{t('appLabelUseOfFunds')}}</label>
              <select v-model="addForm.use_of_funds">
                <option value="inventory_purchase">{{t('appOptInventory')}}</option>
                <option value="equipment_purchase">{{t('appOptEquipment')}}</option>
                <option value="working_capital">{{t('appOptWorkingCapital')}}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{t('appLabelLoanRatio')}} <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">{{t('appLoanRatioTip')}}</span></span></label>
              <div class="loan-ratio-display"><div class="ratio-label">{{t('appAutoCalculated')}}</div>{{loanRatio}}</div>
            </div>
          </div>

          <div v-if="addMsg" style="margin-top:12px;padding:8px 12px;border-radius:6px;font-size:13px" :style="addErr ? 'background:#ffe3e3;color:#c92a2a' : 'background:#d3f9d8;color:#2b8a3e'">{{addMsg}}</div>

          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
            <button class="btn" @click="showAdd=false" style="background:#e9ecef">{{t('btnCancel')}}</button>
            <button class="btn btn-primary" :disabled="submitting" @click="submitApp(false)">{{submitting ? t('appSaving') : t('appSave')}}</button>
            <button class="btn btn-success" :disabled="submitting" @click="submitApp(true)">{{submitting ? t('appSaving') : t('appSaveAndAI')}}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const apps = ref([]);
    const customers = ref([]);
    const showAdd = ref(false);
    const selectedCustomer = ref(null);
    const addMsg = ref('');
    const addErr = ref(false);
    const submitting = ref(false);
    const filter = ref('all');
    const statuses = computed(() => [
      { value: 'all', label: t('appFilterAll') },
      { value: 'pending', label: t('appFilterPending') },
      { value: 'approved', label: t('appFilterApproved') },
      { value: 'rejected', label: t('appFilterRejected') },
    ]);

    const today = new Date().toISOString().slice(0,10);
    const addForm = reactive({
      customer_id: '', application_date: today,
      contract_amount: 0, requested_loan_amount: 0, down_payment_amount: 0,
      loan_term_months: 3, use_of_funds: 'inventory_purchase',
      application_status: 'pending'
    });

    const loanRatio = computed(() => {
      if (addForm.contract_amount > 0) return fmtPct(addForm.requested_loan_amount / addForm.contract_amount);
      return '-';
    });

    const filtered = computed(() => {
      if (filter.value === 'all') return apps.value;
      return apps.value.filter(a => a.application_status === filter.value);
    });

    const loadApps = async () => { apps.value = await (await fetch(API + '/applications')).json(); };
    onMounted(async () => {
      await loadApps();
      customers.value = await (await fetch(API+'/customers')).json();
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') showAdd.value = false; });
    });

    const openAdd = () => {
      addMsg.value = '';
      addErr.value = false;
      addForm.customer_id = '';
      addForm.application_date = new Date().toISOString().slice(0,10);
      addForm.contract_amount = 0;
      addForm.requested_loan_amount = 0;
      addForm.down_payment_amount = 0;
      addForm.loan_term_months = 3;
      addForm.use_of_funds = 'inventory_purchase';
      selectedCustomer.value = null;
      showAdd.value = true;
    };

    const onCustomerChange = () => {
      selectedCustomer.value = customers.value.find(c => c.customer_id === addForm.customer_id) || null;
    };

    const submitApp = async (generateAI) => {
      addMsg.value = '';
      addErr.value = false;
      submitting.value = true;
      try {
        const res = await fetch(API+'/applications', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({...addForm, application_status: 'pending'})
        });

        if (!res.ok) {
          const err = await res.json();
          addMsg.value = err.detail || t('custUnknownError');
          addErr.value = true;
          return;
        }

        const appData = await res.json();

        if (generateAI) {
          await fetch(API+'/ai-output/'+appData.application_id+'/generate', { method:'POST' });
        }

        let msg = t('appCreated').replace('{id}', appData.application_id);
        if (generateAI) msg += t('appAIGenerated');
        if (appData.manual_review_required) msg += t('appEscalatedMsg');
        addMsg.value = msg;

        await loadApps();
        showAdd.value = false;
      } finally {
        submitting.value = false;
      }
    };

    return { apps, filter, filtered, statuses, customers, showAdd, addForm, selectedCustomer,
             loanRatio, addMsg, addErr, openAdd, onCustomerChange, submitApp, submitting,
             fmtR, fmtPct, riskLabel, receivableLabel, receivableColor, disbursementLabel, disbursementColor,
             appStatusLabel, fundsLabel, t };
  }
};

// ══════════════════════════ Router ══════════════════════════
const routes = [
  { path: '/', component: DashboardPage },
  { path: '/customers', component: CustomersPage },
  { path: '/customers/:id', component: CustomerDetailPage },
  { path: '/applications', component: AllApplicationsPage },
];

const router = createRouter({ history: createWebHashHistory(), routes });
const app = createApp({
  setup() {
    return { currentLang, setLang, t };
  }
});
app.config.globalProperties.$t = t;
app.config.globalProperties.$lang = currentLang;
app.use(router);
app.mount('#app');

// Close tooltip popups when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.dash-tip.active').forEach(el => el.classList.remove('active'));
});

const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const API = '/api';

// ══════════════════════════ Helpers ══════════════════════════
function fmtR(v) { return v != null ? 'R' + Number(v).toLocaleString('en-ZA', {minimumFractionDigits: 0}) : '-'; }
function fmtPct(v) { return v != null ? (v * 100).toFixed(0) + '%' : '-'; }
function riskColor(level) { return ({low:'green', medium:'orange', high:'red'})[level] || ''; }
function riskLabel(level) { return ({low:'Low', medium:'Medium', high:'High'})[level] || level || '-'; }
function custStatusLabel(s) { return ({active:'Active', watchlist:'Watchlist', suspended:'Suspended', inactive:'Inactive'})[s] || s; }
function termLabel(m) { return m === 6 ? '6 months (180 days)' : '3 months (90 days)'; }
function gradeColor(g) { return ({A:'green', B:'blue', C:'orange', D:'red'})[g] || ''; }
function receivableLabel(s) { return ({not_yet_due:'Not yet due', due:'Due', overdue:'Overdue', paid:'Paid by buyer'})[s] || s || 'Not yet due'; }
function receivableColor(s) { return ({not_yet_due:'orange', due:'green', overdue:'red', paid:'settled'})[s] || 'draft'; }
function disbursementLabel(s) { return s === 'disbursed' ? 'Disbursed' : 'Not disbursed'; }
function disbursementColor(s) { return s === 'disbursed' ? 'green' : 'draft'; }

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
      <h1 style="margin-bottom:16px">Dashboard</h1>

      <!-- Quick Start Guide (collapsible) -->
      <details class="quick-guide" style="margin-bottom:20px">
        <summary>How does this system work? (click to expand)</summary>
        <div class="quick-guide-body">
          <div class="quick-guide-steps">
            <div class="quick-guide-step"><span class="quick-guide-num">1</span><div><strong>Register a Customer</strong><br>Go to <em>Customers</em> and add the buyer&rsquo;s profile, credit grade, and contact info.</div></div>
            <div class="quick-guide-step"><span class="quick-guide-num">2</span><div><strong>Submit an Application</strong><br>Go to <em>New Application</em>, select the customer, fill in contract &amp; loan details, then save.</div></div>
            <div class="quick-guide-step"><span class="quick-guide-num">3</span><div><strong>AI Risk Assessment</strong><br>The system scores the application across 4 dimensions (25 pts each, 100 total) and recommends loan terms.</div></div>
            <div class="quick-guide-step"><span class="quick-guide-num">4</span><div><strong>Approve or Reject</strong><br>Review the AI output in the customer&rsquo;s <em>Pre-loan Assessment</em> tab and submit your decision.</div></div>
          </div>
          <p style="margin-top:12px;font-size:12px;color:#868e96"><strong>Key concepts:</strong> <em>Risk Score</em> (0&ndash;100, AI-computed) determines <em>Risk Level</em> (Low &ge;80 / Medium &ge;60 / High &lt;60). <em>Credit Grade</em> (A&ndash;D) is a separate manual assessment. <em>Loan Ratio</em> = Loan Amount &divide; Contract Amount.</p>
        </div>
      </details>

      <!-- Utilization Warning Banner -->
      <div v-if="stats.utilization_warning" class="warning-banner" :class="{danger: stats.utilization_ratio > 0.85}">
        {{stats.utilization_warning}}
      </div>

      <!-- ═══ ROW 1: Key Financial Metrics ═══ -->
      <div class="dash-kpi-row">
        <div class="dash-kpi-card">
          <div class="dash-kpi-label">Current Outstanding <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Current outstanding balance for active loans.</span></span></div>
          <div class="dash-kpi-value">{{fmtR(stats.current_outstanding)}}</div>
          <div class="dash-kpi-sub">of {{fmtR(stats.project_total_limit)}} limit</div>
        </div>
        <div class="dash-kpi-card">
          <div class="dash-kpi-label">Remaining Capacity</div>
          <div class="dash-kpi-value green">{{fmtR(stats.remaining_capacity)}}</div>
          <div class="dash-kpi-sub">utilization {{fmtPct(stats.utilization_ratio)}}</div>
        </div>
        <div class="dash-kpi-card">
          <div class="dash-kpi-label">Accounts Receivable <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Total amount owed to us by buyers for disbursed loans not yet repaid.</span></span></div>
          <div class="dash-kpi-value">{{fmtR(stats.total_accounts_receivable || 0)}}</div>
          <div class="dash-kpi-sub">unpaid from buyers</div>
        </div>
        <div class="dash-kpi-card">
          <div class="dash-kpi-label">Accounts Payable <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Total amount we owe to suppliers for approved loans pending disbursement.</span></span></div>
          <div class="dash-kpi-value">{{fmtR(stats.total_accounts_payable || 0)}}</div>
          <div class="dash-kpi-sub">payables to suppliers</div>
        </div>
      </div>

      <!-- Utilization bar -->
      <div class="dash-util-strip">
        <div class="dash-util-strip-label">Project Utilization</div>
        <div class="dash-util-strip-bar">
          <div class="dash-util-strip-fill" :class="stats.utilization_ratio>0.7?'red':stats.utilization_ratio>0.5?'orange':'green'" :style="{width: Math.min(stats.utilization_ratio*100,100)+'%'}"></div>
        </div>
        <div class="dash-util-strip-pct" :class="stats.utilization_ratio>0.7?'red':stats.utilization_ratio>0.5?'orange':'green'">{{fmtPct(stats.utilization_ratio)}}</div>
      </div>

      <!-- ═══ ROW 2a: Status Overview (neutral) ═══ -->
      <div class="metrics-tier1">
        <div class="tier1-card">
          <div class="tier1-label">Customers</div>
          <div class="tier1-value">{{stats.total_customers}}</div>
        </div>
        <div class="tier1-card">
          <div class="tier1-label">Applications</div>
          <div class="tier1-value">{{stats.total_applications}}</div>
        </div>
        <div class="tier1-card">
          <div class="tier1-label">Total Loan Volume <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Total disbursed loan volume for all loans, including repaid ones.</span></span></div>
          <div class="tier1-value">{{fmtR(stats.total_loan_amount)}}</div>
          <div class="tier1-hint">all applications</div>
        </div>
        <div class="tier1-card">
          <div class="tier1-label">Avg Risk Score <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Average of all application risk scores. 80–100 = Low risk, 60–79 = Medium, below 60 = High risk.</span></span></div>
          <div class="tier1-value" :class="stats.avg_risk_score>=80?'green':stats.avg_risk_score>=60?'orange':'red'">{{stats.avg_risk_score}}</div>
          <div class="tier1-hint">portfolio weighted</div>
        </div>
      </div>

      <!-- ═══ ROW 2b: Risk Alerts ═══ -->
      <div class="metrics-tier2">
        <div class="tier2-card">
          <div class="tier2-icon amber">!</div>
          <div class="tier2-body">
            <div class="tier2-label">Overdue Loans <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Overdue exposure: total loan amount and count of applications where the buyer has missed the payment due date (DPD > 0).</span></span></div>
            <div class="tier2-main">
              <span class="tier2-value amber">{{fmtR(stats.overdue_amount || 0)}}</span>
              <span class="tier2-badge amber">{{stats.overdue_count || 0}}/{{stats.total_applications}} ({{fmtPct((stats.overdue_count||0)/(stats.total_applications||1))}})</span>
            </div>
            <div class="tier2-detail">{{stats.overdue_highest_name ? 'Highest: ' + stats.overdue_highest_name + ' — ' + stats.overdue_highest_dpd + ' days overdue' : 'No overdue loans'}}</div>
          </div>
        </div>
        <div class="tier2-card">
          <div class="tier2-icon danger">%</div>
          <div class="tier2-body">
            <div class="tier2-label">Collection Efficiency <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Collection efficiency: percentage of matured loan amounts that have been fully repaid by buyers, and average days from due date to payment.</span></span></div>
            <div class="tier2-main">
              <span class="tier2-value" :class="(stats.collection_rate||0)>=0.9?'green':(stats.collection_rate||0)>=0.85?'amber':'danger'">{{fmtPct(stats.collection_rate || 0)}}</span>
              <span class="tier2-badge" :class="(stats.collection_rate||0)>=0.8?'green':'danger'">{{(stats.collection_rate||0)>=0.8 ? 'On target' : 'Below target 80%'}}</span>
            </div>
            <div class="tier2-detail">Avg days to collect: D+25</div>
          </div>
        </div>
      </div>

      <!-- ═══ ROW 3: Charts ═══ -->
      <div class="dash-charts-row">
        <div class="chart-box"><h3>Risk Distribution <span style="font-weight:400;color:#868e96">(Applications)</span></h3><canvas ref="riskChart"></canvas></div>
        <div class="chart-box"><h3>Application Status <span style="font-weight:400;color:#868e96">(number of applications)</span></h3><canvas ref="statusChart"></canvas></div>
      </div>

      <!-- ═══ ROW 4: AI Portfolio Insight ═══ -->
      <div class="portfolio-insight-card" v-if="stats.portfolio_insight">
        <div class="portfolio-insight-header">
          <span class="portfolio-insight-icon">&#9679;</span>
          <h3>AI Portfolio Insight</h3>
        </div>
        <div class="portfolio-insight-body">
          <p v-for="para in stats.portfolio_insight.split('\\n\\n')" :key="para">{{para}}</p>
        </div>
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
          labels: ['Low', 'Medium', 'High'],
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
          labels: Object.keys(sd),
          datasets: [{ label: 'Applications', data: Object.values(sd), backgroundColor: statusColors }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
      });
    });

    return { stats, riskChart, statusChart, fmtR, fmtPct, riskLabel };
  }
};

// ══════════════════════════ Customers Page ══════════════════════════
const CustomersPage = {
  template: `
    <div>
      <div class="detail-header">
        <div>
          <h1>Customer Management</h1>
        </div>
        <button class="btn btn-primary" @click="showAdd=true">+ New Customer</button>
      </div>
      <div class="panel" style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>ID</th><th>Name</th><th>City/Port</th><th>Grade</th>
            <th>Credit Limit</th><th>Outstanding</th><th>Utilization</th>
            <th>Risk Score</th><th>Ever Overdue</th><th>Actions</th>
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
                <span v-if="c.ever_overdue" class="overdue-dot red" title="This customer has at least one historical overdue loan"></span>
                <span v-else class="overdue-dot green" title="No overdue history"></span>
              </td>
              <td><router-link :to="'/customers/'+c.customer_id" class="btn btn-primary btn-sm">Detail</router-link></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Customer Modal -->
      <div v-if="showAdd" class="modal-overlay" @click.self="showAdd=false">
        <div class="modal">
          <h3>New Customer</h3>
          <div class="form-grid">
            <div class="form-group"><label>Name</label><input v-model="form.customer_name"></div>
            <div class="form-group"><label>City/Port Type</label>
              <select v-model="form.city_or_port_type"><option value="city">City</option><option value="port">Port</option></select>
            </div>
            <div class="form-group"><label>City/Port</label>
              <select v-model="form.city_or_port">
                <option v-for="o in (form.city_or_port_type==='port'?ports:cities)" :value="o">{{o}}</option>
              </select>
            </div>
            <div class="form-group"><label>Industry</label>
              <select v-model="form.industry_type">
                <option value="auto_parts_wholesale">Auto Parts Wholesale</option>
                <option value="auto_parts_retail">Auto Parts Retail</option>
                <option value="auto_repair">Auto Repair</option>
                <option value="vehicle_dealer">Vehicle Dealer</option>
              </select>
            </div>
            <div class="form-group"><label>Years in Auto Parts</label><input type="number" v-model.number="form.years_in_auto_parts"></div>
            <div class="form-group"><label>Cooperation Months <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">How many months this customer has been doing business with us.</span></span></label><input type="number" v-model.number="form.cooperation_months"></div>
            <div class="form-group"><label>Historical Order Amount (ZAR) <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Total value of all past purchase orders placed by this customer.</span></span></label><input type="number" v-model.number="form.total_historical_order_amount"></div>
            <div class="form-group"><label>Contact Name</label><input v-model="form.contact_name"></div>
            <div class="form-group"><label>Contact Phone</label><input v-model="form.contact_phone"></div>
            <div class="form-group"><label>Key Customer</label><select v-model="form.is_key_customer"><option :value="true">Yes</option><option :value="false">No</option></select></div>
            <div class="form-group"><label>Internal Credit Grade <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">A = Excellent, B = Good, C = Fair, D = Poor. Subjective assessment by the risk team.</span></span></label>
              <select v-model="form.credit_grade">
                <option value="A">A – Excellent</option><option value="B">B – Good</option><option value="C">C – Fair</option><option value="D">D – Poor</option>
              </select>
            </div>
          </div>
          <p class="form-hint">Customer ID will be auto-generated.</p>
          <div style="text-align:right;margin-top:16px">
            <button class="btn" @click="showAdd=false" style="background:#e9ecef">Cancel</button>
            <button class="btn btn-primary" @click="addCustomer">Save</button>
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
          alert('Failed to create customer: ' + (err.detail || 'Unknown error'));
          return;
        }
        showAdd.value = false;
        await load();
      } catch (e) {
        alert('Network error: ' + e.message);
      }
    };

    return { customers, showAdd, form, cities, ports, addCustomer, fmtR, fmtPct, riskLabel, custStatusLabel, gradeColor };
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
            <span v-if="detail.customer.is_key_customer" class="badge active">Key Customer</span>
            <span v-if="detail.current_risk_level" class="badge" :class="detail.current_risk_level">{{riskLabel(detail.current_risk_level)}}</span>
            <span class="badge" :class="gradeColor(detail.customer.credit_grade)">Grade: {{detail.customer.credit_grade || '-'}}</span>
          </div>
        </div>
        <router-link to="/customers" class="btn" style="background:#e9ecef">Back</router-link>
      </div>

      <!-- Blocked/Watchlist status messages -->
      <div v-if="detail.customer.customer_status==='suspended'" class="warning-banner danger">
        Status: Suspended (High Risk). New applications for this customer will be escalated for senior approval.
      </div>
      <div v-if="detail.customer.customer_status==='watchlist'" class="watchlist-message">
        Customer is on Watchlist (Medium Risk). All new applications require manual approval. No auto-pass flow.
      </div>
      <div v-if="detail.utilization_warning" class="warning-banner">
        {{detail.utilization_warning}}
      </div>

      <!-- Customer Profile (always visible, above tabs) -->
      <h3 class="lifecycle-heading">Customer Profile</h3>
      <div class="panel">
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Customer ID</div><div class="info-value">{{detail.customer.customer_id}}</div></div>
          <div class="info-item"><div class="info-label">Country</div><div class="info-value">{{detail.customer.country}}</div></div>
          <div class="info-item"><div class="info-label">Location</div><div class="info-value">{{detail.customer.city_or_port}} ({{detail.customer.city_or_port_type}})</div></div>
          <div class="info-item"><div class="info-label">Industry</div><div class="info-value">{{(detail.customer.industry_type||'').replace(/_/g,' ')}}</div></div>
          <div class="info-item"><div class="info-label">Years in Auto Parts</div><div class="info-value">{{detail.customer.years_in_auto_parts}}</div></div>
          <div class="info-item"><div class="info-label">Cooperation Months</div><div class="info-value">{{detail.customer.cooperation_months}}</div></div>
          <div class="info-item"><div class="info-label">Historical Orders</div><div class="info-value">{{fmtR(detail.customer.total_historical_order_amount)}}</div></div>
          <div class="info-item"><div class="info-label">Internal Credit Grade <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Manually assigned by the risk team (A = Excellent, B = Good, C = Fair, D = Poor). Separate from the AI-computed risk score.</span></span></div><div class="info-value"><span class="badge" :class="gradeColor(detail.customer.credit_grade)">{{detail.customer.credit_grade || '-'}}</span></div></div>
          <div class="info-item"><div class="info-label">Contact</div><div class="info-value">{{detail.customer.contact_name}} {{detail.customer.contact_phone}}</div></div>
        </div>
      </div>

      <!-- Credit Exposure Card -->
      <div class="credit-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:16px;font-weight:600">Credit Exposure</div>
          <div style="font-size:13px;opacity:.7">ID: {{detail.customer.customer_id}}</div>
        </div>
        <div class="cc-row">
          <div><div class="cc-label">Total Credit Limit <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Maximum approved credit line for this customer.</span></span></div><div class="cc-value">{{fmtR(detail.customer.total_credit_limit)}}</div></div>
          <div><div class="cc-label">Total Disbursed <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Cumulative loan amount disbursed across all applications, including repaid.</span></span></div><div class="cc-value">{{fmtR(detail.customer.total_disbursed_amount)}}</div></div>
          <div><div class="cc-label">Current Outstanding <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Outstanding balance of active loans not yet repaid.</span></span></div><div class="cc-value">{{fmtR(detail.customer.current_outstanding_amount)}}</div></div>
        </div>
        <div style="margin-top:12px">
          <div class="cc-label">Utilization <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Current outstanding / Total credit limit. High utilization means the customer is close to their credit ceiling.</span></span>: {{fmtPct(detail.credit_utilization)}}</div>
          <div class="progress-bar"><div class="progress-fill" :class="{warning: detail.credit_utilization > 0.5, danger: detail.credit_utilization > 0.8}" :style="{width: Math.min(detail.credit_utilization*100,100)+'%'}"></div></div>
        </div>
      </div>

      <!-- Application Summary & Risk (always visible, below Credit Exposure) -->
      <h3 class="lifecycle-heading">Application Summary & Risk</h3>
      <div class="panel">
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Total Applications</div><div class="info-value">{{detail.total_application_count}}</div></div>
          <div class="info-item"><div class="info-label">Total Application Amount</div><div class="info-value">{{fmtR(detail.total_application_amount)}}</div></div>
          <div class="info-item"><div class="info-label">Current Risk Level <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Derived from AI risk score: Low (80–100), Medium (60–79), High (0–59). Determines customer status.</span></span></div><div class="info-value"><span v-if="detail.current_risk_level" class="badge" :class="detail.current_risk_level">{{riskLabel(detail.current_risk_level)}}</span><span v-else>-</span></div></div>
          <div class="info-item"><div class="info-label">Risk Score <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">AI-computed score from 4 dimensions (25 pts each): Business Stability, Repayment History, Financing Structure, Logistics and Pickup.</span></span></div><div class="info-value">{{detail.current_risk_score ?? '-'}} / 100</div></div>
        </div>
      </div>

      <!-- Main Tabs: Pre-loan / In-loan / Post-loan -->
      <div class="tabs">
        <div class="tab" :class="{active: mainTab==='pre'}" @click="mainTab='pre'">Pre-loan Assessment</div>
        <div class="tab" :class="{active: mainTab==='in'}" @click="mainTab='in'">In-loan Monitoring</div>
        <div class="tab" :class="{active: mainTab==='post'}" @click="mainTab='post'">Post-loan & Governance</div>
      </div>

      <!-- ═══ PRE-LOAN ASSESSMENT TAB ═══ -->
      <div v-if="mainTab==='pre'">

        <!-- Pending Applications (awaiting approval) -->
        <div v-if="pendingApps.length">
          <h3 class="lifecycle-heading">Pending Applications</h3>
          <div v-for="ad in pendingApps" :key="ad.application.application_id" :id="'app-'+ad.application.application_id" class="panel">

            <!-- Approval Decision — at the very top -->
            <div v-if="ad.application.application_status==='pending'" class="approval-decision-block" style="margin-bottom:20px">
              <h3 style="font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:4px">Approval Decision</h3>
              <p style="font-size:12px;color:#946800;margin-bottom:12px">Review the AI assessment below, then choose: <strong>Approve</strong> to proceed with financing or <strong>Reject</strong> to decline.</p>
              <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
                <div class="form-group" style="margin:0;flex:0 0 140px">
                  <label>Decision</label>
                  <select v-model="overrideForm[ad.application.application_id]">
                    <option value="pass">Approve</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
                <div class="form-group" style="margin:0;flex:1">
                  <label>Reason</label>
                  <input v-model="overrideReason[ad.application.application_id]" placeholder="e.g. Approved per AI recommendation / Need senior review / Insufficient collateral...">
                </div>
                <button class="btn btn-success" :disabled="saving[ad.application.application_id]" @click="doOverride(ad.application.application_id)">{{saving[ad.application.application_id] ? 'Submitting...' : 'Submit Decision'}}</button>
              </div>
            </div>

            <div class="detail-header" style="margin-bottom:12px">
              <h2>Application: {{ad.application.application_id}}</h2>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="badge" :class="ad.application.application_status">{{ad.application.application_status}}</span>
                <span v-if="ad.application.manual_review_required" class="badge escalated-flag">Escalated</span>
                <span v-if="ad.application.manual_decision" class="badge" :class="{approved: ad.application.manual_decision==='pass', rejected: ad.application.manual_decision==='reject'}">
                  Decision: {{ad.application.manual_decision === 'pass' ? 'Approved' : ad.application.manual_decision === 'reject' ? 'Rejected' : ad.application.manual_decision}}
                </span>
              </div>
            </div>

            <!-- Application Info (no logistics — pending won't have it) -->
            <div class="info-grid" style="margin-bottom:20px">
              <div class="info-item"><div class="info-label">Date</div><div class="info-value">{{ad.application.application_date}}</div></div>
              <div class="info-item"><div class="info-label">Contract Amount</div><div class="info-value">{{fmtR(ad.application.contract_amount)}}</div></div>
              <div class="info-item"><div class="info-label">Loan Ratio <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Loan amount ÷ Contract amount. A lower ratio means less leverage and lower risk.</span></span></div><div class="info-value loan-ratio-display">{{ad.application.loan_ratio != null ? fmtPct(ad.application.loan_ratio) : '-'}}</div></div>
              <div class="info-item">
                <div class="info-label">Loan Amount</div>
                <div class="info-value">{{fmtR(ad.application.requested_loan_amount)}}
                  <span v-if="ad.ai_output && isLoanOutOfBand(ad.application.requested_loan_amount, ad.ai_output.recommended_loan_band)" class="mismatch-tag" title="The requested loan amount falls outside the AI's recommended range. Consider adjusting or documenting the reason.">Outside recommended band</span>
                </div>
              </div>
              <div class="info-item"><div class="info-label">Down Payment</div><div class="info-value">{{fmtR(ad.application.down_payment_amount)}}</div></div>
              <div class="info-item">
                <div class="info-label">Loan Term</div>
                <div class="info-value">{{termLabel(ad.application.loan_term_months)}}
                  <span v-if="ad.ai_output && isTermMismatch(ad.application.loan_term_months, ad.ai_output.recommended_term)" class="mismatch-tag" title="The chosen loan term differs from the AI recommendation. This may increase risk — check the AI explanation for details.">Term mismatch</span>
                </div>
              </div>
              <div class="info-item"><div class="info-label">Use of Funds</div><div class="info-value">{{(ad.application.use_of_funds||'').replace(/_/g,' ')}}</div></div>
              <div class="info-item"><div class="info-label">Receivable Status</div><div class="info-value"><span class="badge" :class="receivableColor(ad.application.receivable_status)">{{receivableLabel(ad.application.receivable_status)}}</span></div></div>
            </div>

            <!-- Risk Assessment (inline, no sub-tabs) -->
            <div v-if="ad.ai_output">
              <h4 class="lifecycle-subheading">Risk Assessment</h4>
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

              <h4 style="font-size:14px;margin-bottom:8px">AI Risk Summary</h4>
              <div class="ai-box" :class="{warning:ad.ai_output.risk_level==='medium',danger:ad.ai_output.risk_level==='high'}">{{ad.ai_output.ai_risk_summary}}</div>

              <h4 style="font-size:14px;margin-bottom:8px">AI Credit Recommendation</h4>
              <div class="ai-box">{{ad.ai_output.ai_recommendation}}</div>

              <div class="info-grid" style="margin-bottom:16px">
                <div class="info-item"><div class="info-label">Recommended Loan Band</div><div class="info-value">{{ad.ai_output.recommended_loan_band}}</div></div>
                <div class="info-item"><div class="info-label">Recommended Term</div><div class="info-value">{{ad.ai_output.recommended_term}}</div></div>
                <div class="info-item"><div class="info-label">Recommended Down Payment</div><div class="info-value">{{ad.ai_output.recommended_down_payment_ratio}}</div></div>
              </div>

              <div v-if="ad.ai_output.anomaly_flags && ad.ai_output.anomaly_flags.length">
                <h4 style="font-size:14px;margin-bottom:8px">Anomaly Flags</h4>
                <ul class="anomaly-list"><li v-for="f in ad.ai_output.anomaly_flags" :key="f">{{f}}</li></ul>
              </div>

              <details style="margin-top:12px">
                <summary style="cursor:pointer;font-size:13px;color:#868e96">Show Score Explanation</summary>
                <div class="ai-box" style="margin-top:8px">{{ad.ai_output.ai_explanation}}</div>
              </details>
            </div>
            <div v-else>
              <p style="color:#868e96;margin-bottom:12px">AI assessment not yet generated.</p>
              <button class="btn btn-primary" :disabled="saving[ad.application.application_id]" @click="generateAI(ad.application.application_id)">{{saving[ad.application.application_id] ? 'Generating...' : 'Generate AI Assessment'}}</button>
            </div>
          </div>
        </div>

        <!-- No pending apps and no AI — guide the user -->
        <div v-if="!pendingApps.length && !latestAI" class="panel" style="text-align:center;padding:40px">
          <p style="color:#868e96;font-size:14px;margin-bottom:12px">No pending applications for this customer.</p>
          <router-link to="/applications" class="btn btn-primary">Create New Application</router-link>
        </div>

        <!-- Latest AI Assessment (customer-level summary when no pending apps) -->
        <div v-if="!pendingApps.length && latestAI">
          <h3 class="lifecycle-heading">AI Risk Summary & Credit Recommendation</h3>
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
            <h4 style="font-size:14px;margin-bottom:8px">AI Risk Summary</h4>
            <div class="ai-box" :class="{warning:latestAI.risk_level==='medium',danger:latestAI.risk_level==='high'}">{{latestAI.ai_risk_summary}}</div>
            <h4 style="font-size:14px;margin-bottom:8px">AI Credit Recommendation</h4>
            <div class="ai-box">{{latestAI.ai_recommendation}}</div>
          </div>
        </div>
      </div>

      <!-- ═══ IN-LOAN MONITORING TAB ═══ -->
      <div v-if="mainTab==='in'">
        <p class="lifecycle-subheading">Approved loans not yet fully repaid &ndash; logistics, pickup, and overdue tracking</p>
        <div v-if="inLoanApps.length === 0" class="panel"><p style="color:#868e96">No active loans currently under monitoring.</p></div>
        <div v-for="ad in inLoanApps" :key="ad.application.application_id" :id="'app-'+ad.application.application_id" class="panel">
          <div class="detail-header" style="margin-bottom:12px">
            <h2>Application: {{ad.application.application_id}}</h2>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="badge approved">Approved</span>
              <span class="badge" :class="disbursementColor(ad.application.disbursement_status)">{{disbursementLabel(ad.application.disbursement_status)}}</span>
              <span class="badge" :class="receivableColor(ad.application.receivable_status)">{{receivableLabel(ad.application.receivable_status)}}</span>
              <span v-if="ad.application.days_past_due > 0" class="badge high">Overdue: {{ad.application.days_past_due}} days</span>
            </div>
          </div>

          <!-- Sub-tabs: Info / Logistics & Pickup -->
          <div class="tabs">
            <div class="tab" :class="{active: appTab[ad.application.application_id]==='info'}" @click="appTab[ad.application.application_id]='info'">Application Info</div>
            <div class="tab" :class="{active: appTab[ad.application.application_id]==='logistics'}" @click="appTab[ad.application.application_id]='logistics'">Logistics & Pickup</div>
          </div>

          <!-- Application Info -->
          <div v-if="appTab[ad.application.application_id]==='info'">
            <div class="info-grid">
              <div class="info-item"><div class="info-label">Date</div><div class="info-value">{{ad.application.application_date}}</div></div>
              <div class="info-item"><div class="info-label">Contract Amount</div><div class="info-value">{{fmtR(ad.application.contract_amount)}}</div></div>
              <div class="info-item"><div class="info-label">Loan Ratio <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Loan amount ÷ Contract amount. A lower ratio means less leverage and lower risk.</span></span></div><div class="info-value loan-ratio-display">{{ad.application.loan_ratio != null ? fmtPct(ad.application.loan_ratio) : '-'}}</div></div>
              <div class="info-item">
                <div class="info-label">Loan Amount</div>
                <div class="info-value">{{fmtR(ad.application.requested_loan_amount)}}
                  <span v-if="ad.ai_output && isLoanOutOfBand(ad.application.requested_loan_amount, ad.ai_output.recommended_loan_band)" class="mismatch-tag" title="The requested loan amount falls outside the AI's recommended range. Consider adjusting the loan amount or documenting the reason for deviation.">Outside recommended band</span>
                </div>
              </div>
              <div class="info-item"><div class="info-label">Down Payment</div><div class="info-value">{{fmtR(ad.application.down_payment_amount)}}</div></div>
              <div class="info-item">
                <div class="info-label">Loan Term</div>
                <div class="info-value">{{termLabel(ad.application.loan_term_months)}}
                  <span v-if="ad.ai_output && isTermMismatch(ad.application.loan_term_months, ad.ai_output.recommended_term)" class="mismatch-tag" title="The chosen loan term differs from the AI recommendation. This may increase risk — check the AI explanation for details.">Term mismatch</span>
                </div>
              </div>
              <div class="info-item"><div class="info-label">Overdue Days</div><div class="info-value" :style="{color: ad.application.days_past_due > 0 ? '#c92a2a' : '#2b8a3e', fontWeight: 600}">{{ad.application.days_past_due || 0}}</div></div>
              <div class="info-item"><div class="info-label">Use of Funds</div><div class="info-value">{{(ad.application.use_of_funds||'').replace(/_/g,' ')}}</div></div>
              <div class="info-item"><div class="info-label">Disbursement <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Whether the loan funds have been released to the supplier.</span></span></div><div class="info-value"><span class="badge" :class="disbursementColor(ad.application.disbursement_status)">{{disbursementLabel(ad.application.disbursement_status)}}</span></div></div>
              <div class="info-item"><div class="info-label">Receivable Status <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Buyer payment obligation status:\nNot yet due: Payment date has not arrived yet.\nDue: Payment is due now (ideal disbursement point).\nOverdue: Payment is past due, buyer has not paid.\nPaid by buyer: Buyer has paid, funds received.</span></span></div><div class="info-value"><span class="badge" :class="receivableColor(ad.application.receivable_status)">{{receivableLabel(ad.application.receivable_status)}}</span></div></div>
            </div>
          </div>

          <!-- Trade Logistics & Pickup Records -->
          <div v-if="appTab[ad.application.application_id]==='logistics'">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <h4 class="lifecycle-subheading" style="margin-bottom:0">Trade Logistics</h4>
              <button class="btn btn-sm btn-primary" @click="toggleLogiForm(ad.application.application_id)">{{logiFormOpen[ad.application.application_id] ? 'Cancel' : (ad.trade_logistics ? 'Edit Logistics' : 'Add Logistics')}}</button>
            </div>

            <!-- Logistics Add/Edit Form -->
            <div v-if="logiFormOpen[ad.application.application_id]" class="panel" style="background:#f8f9fa;margin-bottom:16px">
              <div class="form-grid">
                <div class="form-group"><label>ETD (Est. Departure)</label><input type="date" v-model="logiForm[ad.application.application_id].etd"></div>
                <div class="form-group"><label>ETA (Est. Arrival)</label><input type="date" v-model="logiForm[ad.application.application_id].eta"></div>
                <div class="form-group"><label>Actual Arrival Date</label><input type="date" v-model="logiForm[ad.application.application_id].actual_arrival_date"></div>
                <div class="form-group"><label>Goods Type</label>
                  <select v-model="logiForm[ad.application.application_id].goods_type">
                    <option value="brake_parts">Brake Parts</option><option value="engine_parts">Engine Parts</option>
                    <option value="body_parts">Body Parts</option><option value="suspension_parts">Suspension Parts</option>
                    <option value="mixed_parts">Mixed Parts</option><option value="accessories">Accessories</option>
                  </select>
                </div>
                <div class="form-group"><label>Goods Liquidity</label>
                  <select v-model="logiForm[ad.application.application_id].goods_liquidity_level">
                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-success btn-sm" @click="saveLogi(ad.application.application_id)">Save Logistics</button>
            </div>

            <div v-if="ad.trade_logistics && !logiFormOpen[ad.application.application_id]" class="info-grid" style="margin-bottom:20px">
              <div class="info-item"><div class="info-label">ETD (Est. Departure)</div><div class="info-value">{{ad.trade_logistics.etd||'-'}}</div></div>
              <div class="info-item"><div class="info-label">ETA (Est. Arrival)</div><div class="info-value">{{ad.trade_logistics.eta||'-'}}</div></div>
              <div class="info-item"><div class="info-label">Actual Arrival Date</div><div class="info-value">{{ad.trade_logistics.actual_arrival_date||'Pending'}}</div></div>
              <div class="info-item"><div class="info-label">Goods Type</div><div class="info-value">{{(ad.trade_logistics.goods_type||'').replace(/_/g,' ')}}</div></div>
              <div class="info-item"><div class="info-label">Goods Liquidity <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">How easily the goods can be resold on the open market. Higher liquidity = lower collateral risk.</span></span></div><div class="info-value">{{ad.trade_logistics.goods_liquidity_level||'-'}}</div></div>
            </div>
            <p v-if="!ad.trade_logistics && !logiFormOpen[ad.application.application_id]" style="color:#868e96;margin-bottom:20px">No trade logistics data recorded. Click "Add Logistics" to enter shipping details.</p>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <h4 class="lifecycle-subheading" style="margin-bottom:0">Pickup Records <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Pickup = buyer collecting goods from the warehouse. Slow or irregular pickups may indicate cash flow problems or fraudulent trade.</span></span></h4>
              <button class="btn btn-sm btn-primary" @click="togglePickupForm(ad.application.application_id)">{{pickupFormOpen[ad.application.application_id] ? 'Cancel' : 'Add Pickup'}}</button>
            </div>

            <!-- Add Pickup Form -->
            <div v-if="pickupFormOpen[ad.application.application_id]" class="panel" style="background:#f8f9fa;margin-bottom:16px">
              <div class="form-grid">
                <div class="form-group"><label>Pickup Date</label><input type="date" v-model="pickupForm[ad.application.application_id].pickup_date"></div>
                <div class="form-group"><label>Percentage (%)</label><input type="number" min="0" max="100" v-model.number="pickupForm[ad.application.application_id].pickup_percentage"></div>
                <div class="form-group full"><label>Note</label><input v-model="pickupForm[ad.application.application_id].note" placeholder="e.g. First batch collected"></div>
              </div>
              <button class="btn btn-success btn-sm" @click="savePickup(ad.application.application_id)">Save Pickup Record</button>
            </div>

            <div v-if="ad.pickup_records && ad.pickup_records.length">
              <table class="pickup-table">
                <thead><tr><th>Date</th><th>Percentage</th><th>Note</th></tr></thead>
                <tbody>
                  <tr v-for="pr in ad.pickup_records" :key="pr.id">
                    <td>{{pr.pickup_date}}</td>
                    <td>{{pr.pickup_percentage}}%</td>
                    <td>{{pr.note||'-'}}</td>
                  </tr>
                </tbody>
              </table>
              <div v-if="ad.pickup_summary" class="info-grid" style="margin-top:16px">
                <div class="info-item"><div class="info-label">First Pickup</div><div class="info-value">{{ad.pickup_summary.first_pickup_date}}</div></div>
                <div class="info-item"><div class="info-label">Number of Pickups</div><div class="info-value">{{ad.pickup_summary.number_of_pickups}}</div></div>
                <div class="info-item"><div class="info-label">Total Completion Days</div><div class="info-value">{{ad.pickup_summary.total_completion_days}}</div></div>
                <div class="info-item"><div class="info-label">Days from Arrival to First Pickup</div><div class="info-value">{{ad.pickup_summary.days_from_arrival_to_first_pickup ?? '-'}}</div></div>
                <div class="info-item"><div class="info-label">Pickup Pattern</div><div class="info-value">{{ad.pickup_summary.pickup_pattern_label}}</div></div>
              </div>
            </div>
            <p v-else-if="!pickupFormOpen[ad.application.application_id]" style="color:#868e96">No pickup records yet. Click "Add Pickup" to record a goods collection.</p>
          </div>
        </div>
      </div>

      <!-- ═══ POST-LOAN & GOVERNANCE TAB ═══ -->
      <div v-if="mainTab==='post'">

        <!-- ── Post-loan Alerts ── -->
        <div v-if="postLoanAlerts.length" class="post-alert-card">
          <div class="post-alert-header">Post-loan Alerts ({{postLoanAlerts.length}})</div>
          <ul class="post-alert-list">
            <li v-for="(alert, i) in postLoanAlerts" :key="i" :class="'post-alert-' + alert.severity">{{alert.text}}</li>
          </ul>
        </div>

        <!-- ── Delinquency & Overdue History ── -->
        <h3 class="lifecycle-heading">Delinquency & Overdue History
          <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Days Past Due (DPD) measures the number of days since the buyer's payment obligation became due. In reverse factoring, the overdue party is the buyer (not the customer). The lender bears the credit risk until the buyer pays.</span></span>
        </h3>
        <div class="panel">
          <table v-if="overdueApps.length">
            <thead><tr><th>Application</th><th>Loan Amount</th><th>Term</th><th>DPD Severity</th><th>Receivable</th><th>Recovery</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="ad in overdueApps" :key="ad.application.application_id">
                <td>{{ad.application.application_id}}</td>
                <td>{{fmtR(ad.application.requested_loan_amount)}}</td>
                <td>{{termLabel(ad.application.loan_term_months)}}</td>
                <td>
                  <span class="badge" :class="dpdSeverityClass(ad.application.days_past_due)">Buyer DPD {{ad.application.days_past_due}}d — {{dpdSeverityLabel(ad.application.days_past_due)}}</span>
                </td>
                <td><span class="badge" :class="receivableColor(ad.application.receivable_status)">{{receivableLabel(ad.application.receivable_status)}}</span></td>
                <td>{{ad.application.recovery_amount ? fmtR(ad.application.recovery_amount) : '-'}}</td>
                <td><span class="badge" :class="ad.application.application_status">{{ad.application.application_status}}</span></td>
              </tr>
            </tbody>
          </table>
          <p v-else style="color:#868e96;font-size:13px">No overdue applications.</p>

          <!-- Batch actions for overdue -->
          <div v-if="overdueApps.some(ad => ad.application.days_past_due >= 30)" class="post-batch-bar">
            <span style="font-size:13px;color:#495057;font-weight:600">Batch Actions for DPD 30+:</span>
            <button class="btn btn-sm btn-outline" @click="batchAction('collection')">Send Collection Notice</button>
            <button class="btn btn-sm btn-outline btn-danger-outline" @click="batchAction('freeze')">Freeze Customer</button>
            <button class="btn btn-sm btn-outline" @click="batchAction('legal')">Notify Legal</button>
          </div>
        </div>

        <!-- ── Rejected / Declined Applications ── -->
        <h3 class="lifecycle-heading">Rejected / Declined Applications</h3>
        <div v-if="closedApps.length === 0" class="panel"><p style="color:#868e96">No rejected applications.</p></div>
        <div v-for="ad in closedApps" :key="ad.application.application_id" :id="'app-'+ad.application.application_id" class="panel">
          <div class="detail-header" style="margin-bottom:12px">
            <h2>Application: {{ad.application.application_id}}</h2>
            <span class="badge" :class="ad.application.application_status">{{ad.application.application_status}}</span>
            <span v-if="ad.application.manual_review_required" class="badge escalated-flag">Escalated</span>
          </div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">Date</div><div class="info-value">{{ad.application.application_date}}</div></div>
            <div class="info-item"><div class="info-label">Contract Amount</div><div class="info-value">{{fmtR(ad.application.contract_amount)}}</div></div>
            <div class="info-item"><div class="info-label">Loan Ratio</div><div class="info-value">{{ad.application.loan_ratio != null ? fmtPct(ad.application.loan_ratio) : '-'}}</div></div>
            <div class="info-item"><div class="info-label">Loan Amount</div><div class="info-value">{{fmtR(ad.application.requested_loan_amount)}}</div></div>
            <div class="info-item"><div class="info-label">Term</div><div class="info-value">{{termLabel(ad.application.loan_term_months)}}</div></div>
            <div class="info-item"><div class="info-label">Decision</div><div class="info-value">{{ad.application.manual_decision||'-'}}</div></div>
          </div>
          <div v-if="ad.ai_output" style="margin-top:12px">
            <div class="info-grid">
              <div class="info-item"><div class="info-label">Risk Score</div><div class="info-value"><span class="badge" :class="ad.ai_output.risk_level">{{ad.ai_output.total_risk_score}} ({{riskLabel(ad.ai_output.risk_level)}})</span></div></div>
            </div>
          </div>

          <!-- Override history for this application -->
          <div v-if="ad.ai_output && ad.ai_output.override_flag" class="override-section" style="margin-top:12px;background:#f8f9fa;border:1px solid #dee2e6">
            <h4 style="color:#495057;font-size:13px">Override History</h4>
            <p style="font-size:13px">AI recommended: {{ad.ai_output.risk_level}} risk. Human decision: {{ad.application.manual_decision || '-'}}. Reason: {{ad.ai_output.override_reason || '-'}}</p>
          </div>
        </div>

        <!-- ── Governance Notes ── -->
        <h3 class="lifecycle-heading">Governance Notes</h3>
        <div v-if="governanceApps.length === 0" class="panel">
          <p style="color:#868e96;font-size:13px">No override or governance decisions recorded for this customer.</p>
        </div>
        <div v-for="ad in governanceApps" :key="'gov-'+ad.application.application_id" class="panel gov-card" style="margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <strong>{{ad.application.application_id}}</strong>
            <span class="badge" :class="ad.application.application_status">{{ad.application.application_status}}</span>
            <span class="badge" :class="ad.ai_output.risk_level">{{riskLabel(ad.ai_output.risk_level)}}</span>
            <span style="color:#868e96;font-size:12px">{{ad.ai_output.generated_at ? ad.ai_output.generated_at.split('T')[0] : ''}}</span>
          </div>
          <div class="info-grid" style="margin-bottom:10px">
            <div class="info-item"><div class="info-label">AI Risk Score</div><div class="info-value">{{ad.ai_output.total_risk_score}}/100</div></div>
            <div class="info-item"><div class="info-label">Human Decision</div><div class="info-value" style="font-weight:600">{{ad.application.manual_decision || '-'}}</div></div>
          </div>
          <div class="gov-section">
            <div class="gov-label">Override Reason</div>
            <div class="gov-content">{{ad.ai_output.override_reason}}</div>
          </div>
          <div v-if="ad.ai_output.governance_follow_up" class="gov-section">
            <div class="gov-label">Follow-up Actions</div>
            <div class="gov-content">{{ad.ai_output.governance_follow_up}}</div>
          </div>
          <div v-if="ad.ai_output.governance_outcome" class="gov-section">
            <div class="gov-label">Final Outcome</div>
            <div class="gov-content">{{ad.ai_output.governance_outcome}}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="loadError" style="text-align:center;padding:60px">
      <p style="color:#c92a2a;font-size:14px;margin-bottom:12px">{{loadError}}</p>
      <button class="btn btn-primary" @click="retryLoad">Retry</button>
    </div>
    <div v-else style="text-align:center;padding:60px;color:#868e96">Loading...</div>
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
        if (!res.ok) throw new Error('Customer not found (HTTP ' + res.status + ')');
        detail.value = await res.json();
      } catch (e) {
        loadError.value = 'Failed to load customer: ' + e.message;
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
          alerts.push({ severity: 'critical', text: ad.application.application_id + ': Buyer DPD ' + dpd + ' days — exceeds 30-day threshold, collection/legal action required' });
        } else if (dpd >= 15) {
          alerts.push({ severity: 'warning', text: ad.application.application_id + ': Buyer DPD ' + dpd + ' days — approaching critical threshold' });
        }
      }

      // Slow pickup on disbursed, active loans
      for (const ad of apps) {
        if (ad.application.disbursement_status === 'disbursed' && ad.application.receivable_status !== 'paid' && ad.pickup_summary) {
          const pattern = ad.pickup_summary.pickup_pattern_label || '';
          if (pattern.includes('slow') || pattern.includes('Long idle')) {
            alerts.push({ severity: 'warning', text: ad.application.application_id + ': Pickup pace abnormally slow — collateral turnover risk' });
          }
          if (ad.pickup_summary.days_from_arrival_to_first_pickup != null && ad.pickup_summary.days_from_arrival_to_first_pickup > 14) {
            alerts.push({ severity: 'info', text: ad.application.application_id + ': First pickup ' + ad.pickup_summary.days_from_arrival_to_first_pickup + ' days after arrival — delayed start' });
          }
        }
      }

      // Low liquidity goods on active loans
      for (const ad of apps) {
        if (ad.trade_logistics && ad.trade_logistics.goods_liquidity_level === 'low' && ad.application.disbursement_status === 'disbursed' && ad.application.receivable_status !== 'paid') {
          alerts.push({ severity: 'info', text: ad.application.application_id + ': Low-liquidity goods — higher collateral disposal difficulty if default occurs' });
        }
      }

      // Credit utilization
      const cust = detail.value.customer;
      if (cust.total_credit_limit > 0) {
        const util = (cust.current_outstanding_amount || 0) / cust.total_credit_limit;
        if (util >= 0.8) {
          alerts.push({ severity: 'warning', text: 'Credit utilization at ' + Math.round(util * 100) + '% — approaching limit' });
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
      if (dpd >= 60) return 'Severe';
      if (dpd >= 30) return 'Critical';
      if (dpd >= 15) return 'Elevated';
      return 'Mild';
    }
    function batchAction(action) {
      const labels = { collection: 'Send Collection Notice', freeze: 'Freeze Customer', legal: 'Notify Legal Counsel' };
      alert('Action: ' + (labels[action] || action) + '\\n\\nThis is a demo placeholder. In production this would trigger the corresponding workflow.');
    }

    const latestAI = computed(() => {
      if (!detail.value) return null;
      for (const ad of detail.value.applications) {
        if (ad.ai_output) return ad.ai_output;
      }
      return null;
    });

    const scoreDims = (ao) => [
      { label: 'Business Stability', score: ao.score_stability, tip: 'Industry experience, cooperation length, order history' },
      { label: 'Repayment History', score: ao.score_repayment, tip: 'Past loan repayment track record, overdue history' },
      { label: 'Financing Structure', score: ao.score_structure, tip: 'Loan ratio, down payment adequacy, term appropriateness' },
      { label: 'Logistics & Pickup', score: ao.score_logistics, tip: 'Goods arrival, pickup speed, completion pattern' },
    ];

    const generateAI = async (appId) => {
      saving[appId] = true;
      try {
        const res = await fetch(API + '/ai-output/' + appId + '/generate', { method: 'POST' });
        if (!res.ok) { alert('Failed to generate AI assessment. Please try again.'); return; }
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
        if (!res.ok) { alert('Failed to submit decision. Please try again.'); return; }
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
             receivableLabel, receivableColor, disbursementLabel, disbursementColor };
  }
};

// ══════════════════════════ All Applications Page ══════════════════════════
const AllApplicationsPage = {
  template: `
    <div>
      <div class="detail-header">
        <div>
          <h1>All Applications</h1>
        </div>
        <button class="btn btn-primary" @click="openAdd">+ New Application</button>
      </div>

      <!-- Status filter -->
      <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span style="font-size:13px;font-weight:600;color:#495057">Filter by status:</span>
        <button v-for="s in statuses" :key="s.value" class="btn btn-sm" :class="filter===s.value ? 'btn-primary' : ''" :style="filter!==s.value ? 'background:#e9ecef;color:#495057' : ''" @click="filter=s.value">{{s.label}}</button>
      </div>

      <div class="panel" style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>ID</th><th>Customer</th><th>Loan</th><th>Ratio</th>
            <th>Date</th><th>Term</th><th>Maturity</th><th>Status</th><th>Disbursement</th><th>Risk</th><th>Overdue</th><th>Actions</th>
          </tr></thead>
          <tbody>
            <tr v-for="a in filtered" :key="a.application_id">
              <td>{{a.application_id}}</td>
              <td>{{a.customer_name || a.customer_id}}</td>
              <td>{{fmtR(a.requested_loan_amount)}}</td>
              <td>{{a.loan_ratio != null ? fmtPct(a.loan_ratio) : '-'}}</td>
              <td>{{a.application_date}}</td>
              <td>{{a.loan_term_months ? a.loan_term_months + ' months' : '-'}}</td>
              <td>{{a.maturity_date || '-'}}</td>
              <td><span class="badge" :class="a.application_status">{{a.application_status}}</span><span v-if="a.manual_review_required" class="badge escalated-flag" style="margin-left:4px">Escalated</span></td>
              <td>
                <span v-if="a.application_status==='approved'" class="badge" :class="a.disbursement_status==='disbursed' ? 'disbursed' : 'not-disbursed'">{{a.disbursement_status==='disbursed' ? 'Disbursed' : 'Not disbursed'}}</span>
                <span v-else style="color:#adb5bd">-</span>
              </td>
              <td><span v-if="a.risk_level" class="badge" :class="a.risk_level">{{a.risk_score ?? '-'}} · {{riskLabel(a.risk_level)}}</span><span v-else style="color:#adb5bd">-</span></td>
              <td :style="{color: (a.days_past_due||0) > 0 ? '#c92a2a' : '', fontWeight: (a.days_past_due||0) > 0 ? '600' : ''}">{{a.days_past_due || 0}}</td>
              <td><router-link :to="'/customers/'+a.customer_id+'?app='+a.application_id" class="btn btn-primary btn-sm">Detail</router-link></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!filtered.length" style="color:#868e96;font-size:13px;margin-top:12px">No applications match this filter.</p>
      </div>

      <!-- New Application Modal -->
      <div v-if="showAdd" class="modal-overlay" @click.self="showAdd=false">
        <div class="modal">
          <h3>New Application</h3>

          <div v-if="selectedCustomer && selectedCustomer.customer_status==='suspended'" class="warning-banner danger" style="margin-bottom:12px">
            High Risk customer — application will be escalated for senior approval.
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Customer</label>
              <select v-model="addForm.customer_id" @change="onCustomerChange">
                <option value="">Select customer...</option>
                <option v-for="c in customers" :key="c.customer_id" :value="c.customer_id">{{c.customer_id}} - {{c.customer_name}}</option>
              </select>
            </div>
            <div class="form-group"><label>Application Date</label><input type="date" v-model="addForm.application_date"></div>
            <div class="form-group"><label>Contract Amount (ZAR)</label><input type="number" v-model.number="addForm.contract_amount"></div>
            <div class="form-group"><label>Requested Loan Amount (ZAR)</label><input type="number" v-model.number="addForm.requested_loan_amount"></div>
            <div class="form-group"><label>Down Payment (ZAR)</label><input type="number" v-model.number="addForm.down_payment_amount"></div>
            <div class="form-group">
              <label>Loan Term</label>
              <select v-model="addForm.loan_term_months">
                <option :value="3">3 months (90 days)</option>
                <option :value="6">6 months (180 days)</option>
              </select>
            </div>
            <div class="form-group"><label>Use of Funds</label>
              <select v-model="addForm.use_of_funds">
                <option value="inventory_purchase">Inventory Purchase</option>
                <option value="equipment_purchase">Equipment Purchase</option>
                <option value="working_capital">Working Capital</option>
              </select>
            </div>
            <div class="form-group">
              <label>Loan Ratio <span class="dash-tip" @click.stop="$event.currentTarget.classList.toggle('active')">?<span class="tip-popup">Loan amount ÷ Contract amount. A lower ratio means less leverage and lower risk.</span></span></label>
              <div class="loan-ratio-display"><div class="ratio-label">Auto-calculated</div>{{loanRatio}}</div>
            </div>
          </div>

          <div v-if="addMsg" style="margin-top:12px;padding:8px 12px;border-radius:6px;font-size:13px" :style="addErr ? 'background:#ffe3e3;color:#c92a2a' : 'background:#d3f9d8;color:#2b8a3e'">{{addMsg}}</div>

          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
            <button class="btn" @click="showAdd=false" style="background:#e9ecef">Cancel</button>
            <button class="btn btn-primary" :disabled="submitting" @click="submitApp(false)">{{submitting ? 'Saving...' : 'Save'}}</button>
            <button class="btn btn-success" :disabled="submitting" @click="submitApp(true)">{{submitting ? 'Saving...' : 'Save & AI Assessment'}}</button>
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
    const statuses = [
      { value: 'all', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
    ];

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
          addMsg.value = err.detail || 'Unknown error';
          addErr.value = true;
          return;
        }

        const appData = await res.json();

        if (generateAI) {
          await fetch(API+'/ai-output/'+appData.application_id+'/generate', { method:'POST' });
        }

        let msg = appData.application_id + ' created!';
        if (generateAI) msg += ' AI assessment generated.';
        if (appData.manual_review_required) msg += ' Escalated for senior approval.';
        addMsg.value = msg;

        await loadApps();
        showAdd.value = false;
      } finally {
        submitting.value = false;
      }
    };

    return { apps, filter, filtered, statuses, customers, showAdd, addForm, selectedCustomer,
             loanRatio, addMsg, addErr, openAdd, onCustomerChange, submitApp, submitting,
             fmtR, fmtPct, riskLabel, receivableLabel, receivableColor, disbursementLabel, disbursementColor };
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
const app = createApp({});
app.use(router);
app.mount('#app');

// Close tooltip popups when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.dash-tip.active').forEach(el => el.classList.remove('active'));
});

(() => {
	// keep JS small: hydrate totals if desired via API
	async function fetchExpenses(){
		try{
			const res = await fetch('/api/expenses');
			if(!res.ok) return;
			const data = await res.json();
			// optional: update UI dynamically in future
			console.debug('loaded', data.length, 'expenses')
		}catch(e){
			console.debug('expenses load failed', e)
		}
	}

	if(window.fetch) fetchExpenses()
	else console.log('Personal Finance Tracker loaded')
})();
(() => {
	const api = '/api/expenses'

	function showToast(message, variant = 'info'){
		const id = `t-${Date.now()}`
		const tpl = document.createElement('div')
		tpl.innerHTML = `
			<div id="${id}" class="toast align-items-center text-bg-${variant} border-0" role="alert" aria-live="assertive" aria-atomic="true">
				<div class="d-flex">
					<div class="toast-body">${message}</div>
					<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
				</div>
			</div>`
		const container = document.getElementById('toastContainer')
		container.appendChild(tpl.firstElementChild)
		const bsToast = new bootstrap.Toast(document.getElementById(id), {delay:3000})
		bsToast.show()
	}

	async function postExpense(payload){
		const res = await fetch(api, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload)})
		if(!res.ok){
			const err = await res.json().catch(()=>({}));
			throw new Error(err.error || 'Failed to add')
		}
		return await res.json()
	}

	function recalcTotal(){
		const rows = document.querySelectorAll('#expensesBody tr')
		let total = 0
		rows.forEach(r=>{
			const amtCell = r.querySelector('td[data-amount]')
			if(amtCell){
				const v = parseFloat(amtCell.getAttribute('data-amount') || '0')
				total += isNaN(v)?0:v
			}
		})
		const el = document.getElementById('total')
		if(el) el.textContent = `$${total.toFixed(2)}`
	}

	function makeRow(row){
		const tr = document.createElement('tr')
		const amount = parseFloat(row.amount) || 0
		tr.innerHTML = `
			<td>${row.date || ''}</td>
			<td>${row.category || ''}</td>
			<td class="text-end" data-amount="${amount}">${amount.toFixed(2)}</td>
			<td>${row.note || ''}</td>`
		return tr
	}

	document.addEventListener('DOMContentLoaded', ()=>{
		const form = document.getElementById('expenseForm')
		if(form){
			form.addEventListener('submit', async (ev)=>{
				ev.preventDefault()
				const btn = form.querySelector('button[type=submit]')
				btn.disabled = true
				const data = Object.fromEntries(new FormData(form).entries())
				// simple validation
				if(!data.category || !data.amount){
					showToast('Category and amount are required', 'warning')
					btn.disabled = false
					return
				}
				// default date to today if empty
				if(!data.date){
					data.date = new Date().toISOString().slice(0,10)
				}

				try{
					const saved = await postExpense(data)
					const tr = makeRow(saved)
					const body = document.getElementById('expensesBody')
					if(body) body.prepend(tr)
					recalcTotal()
					form.reset()
					showToast('Expense added', 'success')
				}catch(e){
					console.error(e)
					showToast(e.message || 'Failed to add', 'danger')
				}finally{
					btn.disabled = false
				}
			})
		}
		// ensure totals are formatted
		// mark amount cells with data-amount
		document.querySelectorAll('#expensesBody tr').forEach(r=>{
			const amt = r.querySelector('td:nth-child(3)')
			if(amt){
				const v = parseFloat(amt.textContent.replace(/[^0-9.-]/g,'')) || 0
				amt.setAttribute('data-amount', v)
				amt.textContent = v.toFixed(2)
			}
		})
		recalcTotal()
	})
})();

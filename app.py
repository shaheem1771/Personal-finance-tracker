from flask import Flask, render_template
import csv

app = Flask(__name__)

def read_expenses(path='expenses.csv'):
    rows = []
    try:
        with open(path, newline='') as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows.append(r)
    except FileNotFoundError:
        pass
    return rows

@app.route('/')
def index():
    expenses = read_expenses()
    return render_template('index.html', expenses=expenses)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

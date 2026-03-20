from flask import Flask, render_template, request, redirect, url_for, session, jsonify  # ✅ Added jsonify

import sqlite3
import os
import csv
from werkzeug.security import generate_password_hash, check_password_hash
from flask import send_file 

app = Flask(__name__)
app.secret_key = 'your_secret_key'
DB_PATH = "database.db"

# Initialize Database
def init_db():
    print("🚀 Running init_db()...")
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        conn.commit()

init_db()

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # Fetch all expenses for the user
        cursor.execute("SELECT id, category, amount, date FROM expenses WHERE user_id = ?", (session['user_id'],))
        expenses = cursor.fetchall()

        # Fetch unique categories and sum of amounts for Chart.js visualization
        cursor.execute("SELECT category, SUM(amount) FROM expenses WHERE user_id = ? GROUP BY category", (session['user_id'],))
        category_data = cursor.fetchall()

    print("DEBUG: Expenses from DB ->", expenses)  # Debugging expenses
    print("DEBUG: Categories from DB ->", category_data)  # Debugging categories

    # Ensure categories and amounts are always lists, even if empty
    categories = [row[0] for row in category_data] if category_data else []
    amounts = [row[1] for row in category_data] if category_data else []

    total_expense = sum(amounts)  # Calculate total expense

    return render_template('index.html', expenses=expenses, total_expense=total_expense, categories=categories, amounts=amounts)

@app.route('/api/chart-data')
def get_chart_data():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT category, SUM(amount) FROM expenses WHERE user_id = ? GROUP BY category", (session['user_id'],))
        category_data = cursor.fetchall()

    categories = [row[0] for row in category_data]
    amounts = [row[1] for row in category_data]

    return jsonify({"categories": categories, "amounts": amounts})

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'])
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
                conn.commit()
                return redirect(url_for('login'))
            except:
                return "Username already exists!"
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
            user = cursor.fetchone()
            if user and check_password_hash(user[2], password):
                session['user_id'] = user[0]
                return redirect(url_for('index'))
        return "Invalid credentials!"
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

@app.route('/add', methods=['POST'])
def add_expense():
    category = request.form['category']
    amount = request.form['amount']
    date = request.form['date']
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO expenses (user_id, category, amount, date) VALUES (?, ?, ?, ?)",
                       (session['user_id'], category, amount, date))
        conn.commit()
    return redirect(url_for('index'))



@app.route('/export')
def export():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT category, amount, date FROM expenses WHERE user_id = ?", (session['user_id'],))
        expenses = cursor.fetchall()

    csv_path = "expenses.csv"  # File to be downloaded

    with open(csv_path, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Category", "Amount", "Date"])
        writer.writerows(expenses)

    # Return the file as an attachment to force download
    return send_file(csv_path, as_attachment=True, mimetype="text/csv")

@app.route('/delete/<int:id>')
def delete_expense(id):
    if 'user_id' not in session:
        return redirect(url_for('login'))

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (id, session['user_id']))
        conn.commit()

    return redirect(url_for('index'))

@app.route('/reset', methods=['POST'])
def reset_expenses():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM expenses WHERE user_id = ?", (session['user_id'],))
        conn.commit()

    return redirect(url_for('index'))

@app.route('/edit/<int:id>', methods=['GET', 'POST'])
def edit_expense(id):
    if 'user_id' not in session:
        return redirect(url_for('login'))

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()

        if request.method == 'POST':
            category = request.form['category']
            amount = request.form['amount']
            date = request.form['date']
            cursor.execute("UPDATE expenses SET category = ?, amount = ?, date = ? WHERE id = ? AND user_id = ?", 
                           (category, amount, date, id, session['user_id']))
            conn.commit()
            return redirect(url_for('index'))

        # Fetch expense details for editing
        cursor.execute("SELECT category, amount, date FROM expenses WHERE id = ? AND user_id = ?", (id, session['user_id']))
        expense = cursor.fetchone()

    return render_template('edit.html', expense=expense, id=id)

if __name__ == "__main__":
    init_db()  # Ensure database is initialized
    port = int(os.environ.get("PORT", 5000))  # Use Render's assigned PORT
    app.run(host="0.0.0.0", port=port, debug=True)

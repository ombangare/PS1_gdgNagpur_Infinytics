from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy  # <--- NEW SQLITE IMPORT
from utils import calculate_wait_time, get_peak_hours
from model import predict_disease
import json
import os
import uuid  
import datetime

app = Flask(__name__)
CORS(app)

# -----------------------------
# NEW SQLITE CONFIGURATION
# -----------------------------
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mediflow.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# -----------------------------
# NEW SQLITE MODELS
# -----------------------------
class PatientDB(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    disease = db.Column(db.String(100))
    risk_level = db.Column(db.String(20))
    status = db.Column(db.String(20), default='Waiting')
    priority = db.Column(db.Integer)

class HistoryDB(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    patient_id = db.Column(db.String(50))
    date = db.Column(db.String(50))
    condition = db.Column(db.String(100))
    advice = db.Column(db.Text)
    source = db.Column(db.String(50))
    created_at = db.Column(db.String(50))

# -----------------------------
import tempfile

TEMP_DIR = tempfile.gettempdir()
DATA_FILE = os.path.join(TEMP_DIR, "sample_patients.json")
HISTORY_FILE = os.path.join(TEMP_DIR, "patient_history.json")
COMPLETED_FILE = os.path.join(TEMP_DIR, "completed_patients.json")
DOCTORS = ["Dr. Sharma", "Dr. Mehta", "Dr. Iyer"]

def assign_doctor(queue):
    if not queue:
        return DOCTORS[0]
    return DOCTORS[len(queue) % len(DOCTORS)]

def load_data(filepath):
    try:
        if os.path.exists(filepath):
            with open(filepath, "r") as f:
                content = f.read().strip()
                if content:
                    return json.loads(content)
    except:
        return []
    return []

def save_data(filepath, data):
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w") as f:
             json.dump(data, f, indent=4)
    except:
        pass

# Load all our instant caches!
queue = load_data(DATA_FILE)
history_db = load_data(HISTORY_FILE)
completed_db = load_data(COMPLETED_FILE)
local_history_db = []

# -----------------------------
# 🧠 AI Advice Engine & Priority Scanner
# -----------------------------
def analyze_priority(disease, symptoms):
    disease_lower = disease.lower()
    symptoms_text = ", ".join(symptoms).lower() if symptoms else ""
    combined_text = disease_lower + " " + symptoms_text

    CRITICAL_KEYWORDS = [
        "heart attack", "chest pain", "cardiac", "stroke", "pain in heart", "heart",
        "breathing difficulty", "shortness of breath", "unconscious", "fainting", 
        "seizure", "severe bleeding", "poisoning", "head trauma", "paralysis", 
        "anaphylaxis", "vomiting blood", "choking", "gunshot", "stab"
    ]
    
    HIGH_KEYWORDS = [
        "fracture", "broken bone", "severe pain", "high fever", "asthma", 
        "severe burn", "infection", "headache severe", "blur vision"
    ]
    
    MEDIUM_KEYWORDS = [
        "flu", "fever", "migraine", "vomiting", "diarrhea", "stomach ache", 
        "dizziness", "nausea", "sprain", "rash"
     ]

    if any(keyword in combined_text for keyword in CRITICAL_KEYWORDS):
        return 100, "CRITICAL: Immediate life-threatening symptoms detected."
    elif any(keyword in combined_text for keyword in HIGH_KEYWORDS):
        return 75, "URGENT: Severe symptoms requiring rapid attention."
    elif any(keyword in combined_text for keyword in MEDIUM_KEYWORDS):
        return 50, "MODERATE: Standard illness or moderate discomfort."
    else:
        return 10, "STABLE: General checkup or minor symptoms."

def generate_advice(disease, priority_score):
    if priority_score >= 100:
        return f"⚠️ Serious condition suspected related to {disease}. Seek immediate medical attention. Do not exert yourself."
    elif priority_score >= 75:
        return f"Urgent care needed for {disease}. Please remain seated and notify a nurse if pain worsens."
    elif priority_score >= 50:
        return f"Moderate symptoms detected for {disease}. Rest, stay hydrated, and await doctor consultation."
    else:
        return "Condition appears stable. Routine checkup protocols apply."

# -----------------------------
# Routes
# -----------------------------
@app.route('/add_patient', methods=['POST'])
def add_patient():
    global queue 
    try:
        data = request.json
        raw_symptoms = data.get('symptoms', [])
        if isinstance(raw_symptoms, str):
            symptoms = [s.strip() for s in raw_symptoms.split(',') if s.strip()]
        else:
            symptoms = raw_symptoms

        name = data.get('name')
        age = int(data.get('age', 0)) if data.get('age') else 0
        weight = int(data.get('weight', 0)) if data.get('weight') else 0
        height = int(data.get('height', 0)) if data.get('height') else 0 

        if not name or age == 0:
            return jsonify({"error": "Name and age are required"}), 400

        disease = predict_disease(symptoms)
        priority, reason = analyze_priority(disease, symptoms)
        
        # --- 🚨 QUICK FIX FOR PRESENTATION 🚨 ---
        if priority >= 100 and "General Checkup" in disease:
            disease = "Critical Emergency (Pending Doctor Review)"
        elif priority >= 75 and "General Checkup" in disease:
            disease = "Urgent Care Required"
        # ----------------------------------------

        risk_level = "High" if priority >= 100 else "Medium" if priority >= 50 else "Low"
        patient_id = str(uuid.uuid4())

        patient = {
            "id": patient_id, 
            "name": name,
            "phone": data.get('phone', ''),
            "email": data.get('email', ''),
            "age": age,
            "weight": weight,
            "height": height, 
            "symptoms": symptoms,
            "priority": priority,
            "disease": disease,
            "reason": reason,
            "risk_level": risk_level,
            "assigned_doctor": assign_doctor(queue),
            "arrival_time": datetime.datetime.now().strftime("%H:%M"),
            "advice": generate_advice(disease, priority),
            "status": "Waiting"
        }

        # 1. Update Local Queue Immediately
        queue.append(patient)
        queue = sorted(queue, key=lambda x: int(x.get('priority', 0)), reverse=True)
        save_data(DATA_FILE, queue) # <--- FIXED

        # --- NEW SQLITE ADDITION ---
        try:
            new_db_patient = PatientDB(
                id=patient_id, name=name, phone=data.get('phone', ''), email=data.get('email', ''),
                disease=disease, risk_level=risk_level, status="Waiting", priority=priority
            )
            db.session.add(new_db_patient)
            db.session.commit()
        except Exception as db_e:
            print("SQLite Error on Add Patient:", db_e)
        # ---------------------------

        patient_index = next((i for i, p in enumerate(queue) if p['id'] == patient_id), 0)
        wait_time = patient_index * 15

        # 3. Respond to frontend instantly
        return jsonify({
            "id": patient_id,
            "predicted_disease": disease,
            "condition": disease,      
            "risk_level": risk_level,  
            "wait_time": wait_time,
            "priority": priority,
            "reason": reason,
            "assigned_doctor": patient["assigned_doctor"],
            "advice": patient["advice"]
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/queue', methods=['GET'])
def get_queue():
    sorted_queue = sorted(queue, key=lambda x: int(x.get('priority', 0)), reverse=True)
    return jsonify(sorted_queue)


@app.route('/complete_patient/<string:patient_id>', methods=['POST'])
def complete_patient(patient_id):
    global queue, history_db, completed_db
    data = request.json or {}
    doctor_advice = data.get('advice', 'Standard treatment applied. Rest and hydrate.')

    patient_to_remove = next((p for p in queue if p.get('id') == patient_id), None)

    if patient_to_remove:
        patient_to_remove['advice'] = doctor_advice
        patient_to_remove['status'] = 'Treated'
        queue.remove(patient_to_remove)
        save_data(DATA_FILE, queue)

        history_record = {
            "patient_id": patient_id,
            "date": datetime.datetime.now().strftime("%b %d, %Y"),
            "condition": patient_to_remove.get("disease", "Clinic Checkup"),
            "advice": doctor_advice,
            "source": "Mediflow Clinic",
            "created_at": datetime.datetime.now().isoformat()
        }
        
        history_db.append(history_record)
        save_data(HISTORY_FILE, history_db)

        # --- THE INSTANT CACHE FIX ---
        completed_db.append(patient_to_remove)
        save_data(COMPLETED_FILE, completed_db)
        # -----------------------------

        # --- NEW SQLITE ADDITION ---
        try:
            db_patient = PatientDB.query.get(patient_id)
            if db_patient:
                db_patient.status = 'Treated'
            
            new_history = HistoryDB(
                id=str(uuid.uuid4()), patient_id=patient_id, date=history_record['date'],
                condition=history_record['condition'], advice=history_record['advice'],
                source=history_record['source'], created_at=history_record['created_at']
            )
            db.session.add(new_history)
            db.session.commit()
        except Exception as db_e:
            print("SQLite Error on Complete Patient:", db_e)
        # ---------------------------

        return jsonify({"message": "Patient marked as treated.", "removed": patient_to_remove})

    return jsonify({"error": "Patient not found"}), 404


@app.route('/analytics', methods=['GET'])
def get_analytics():
    return jsonify({"peak_hours": get_peak_hours(queue)})


@app.route('/priority', methods=['GET'])
def get_priority_patients():
    return jsonify([p for p in queue if p.get('priority', 0) >= 100])


@app.route('/doctor_stats', methods=['GET'])
def doctor_stats():
    return jsonify({
        "total_patients": len(queue),
        "critical_cases": len([p for p in queue if p.get('priority', 0) >= 100])
    })


@app.route('/patient_status/<string:patient_id>', methods=['GET'])
def get_patient_status(patient_id):
    global queue, completed_db
    sorted_queue = sorted(queue, key=lambda x: int(x.get('priority', 0)), reverse=True)
    
    for index, p in enumerate(sorted_queue):
        if p.get('id') == patient_id:
            return jsonify({
                "position": index + 1, 
                "wait_time": index * 15,
                "status": p.get('status', 'Waiting')
            })
            
    # --- INSTANT CACHE CHECK (Fixes the infinite loading spinner!) ---
    completed_patient = next((p for p in completed_db if p.get('id') == patient_id), None)
    if completed_patient:
        return jsonify({
            "position": 0, 
            "wait_time": 0, 
            "status": "Treated", 
            "advice": completed_patient.get('advice')
        })
    # -----------------------------------------------------------------

    return jsonify({"error": "Patient not found"}), 404


@app.route('/call_patient/<string:patient_id>', methods=['POST'])
def call_patient(patient_id):
    global queue
    patient = next((p for p in queue if p.get('id') == patient_id), None)
    
    if patient:
        patient['status'] = 'Called'
        save_data(DATA_FILE, queue) # <--- FIXED
        
        # --- NEW SQLITE ADDITION ---
        try:
            db_patient = PatientDB.query.get(patient_id)
            if db_patient:
                db_patient.status = 'Called'
                db.session.commit()
        except Exception as db_e:
            print("SQLite Error on Call Patient:", db_e)
        # ---------------------------
            
        return jsonify({"message": "Patient called successfully"})
        
    return jsonify({"error": "Patient not found"}), 404

@app.route('/patient_history/<string:patient_id>', methods=['GET'])
def get_patient_history(patient_id):
    global local_history_db
    try:
        # Read instantly from local memory
        history = [h for h in local_history_db if h.get('patient_id') == patient_id]
        history = sorted(history, key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/add_external_history/<string:patient_id>', methods=['POST'])
def add_external_history(patient_id):
    global local_history_db
    try:
        data = request.json
        
        # Bulletproof Date Handling
        date_str = data.get("date", "")
        final_date = datetime.datetime.now().strftime("%b %d, %Y")
        if date_str:
            try:
                date_obj = datetime.datetime.strptime(date_str, "%Y-%m-%d")
                final_date = date_obj.strftime("%b %d, %Y")
            except:
                final_date = date_str

        record = {
            "id": str(uuid.uuid4()), # Give it an ID for React
            "patient_id": patient_id,
            "date": final_date,
            "condition": data.get("condition") or data.get("doctor") or "General Checkup",
            "advice": data.get("advice") or data.get("prescription") or "Rest",
            "source": "External Doctor",
            "created_at": datetime.datetime.now().isoformat()
        }
        
        # 1. Save to local memory instantly!
        local_history_db.append(record)
        
        # --- NEW SQLITE ADDITION ---
        try:
            new_sql_history = HistoryDB(
                id=record['id'], patient_id=patient_id, date=final_date,
                condition=record['condition'], advice=record['advice'],
                source=record['source'], created_at=record['created_at']
            )
            db.session.add(new_sql_history)
            db.session.commit()
        except Exception as db_e:
            print("SQLite Error on Add External:", db_e)
        # ---------------------------
        
        return jsonify({"message": "External record added successfully"}), 201
    except Exception as e:
        print(f"History Route Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/retrieve_patient', methods=['POST'])
def retrieve_patient():
    global queue, completed_db 
    data = request.json
    phone_to_find = data.get('phone', '').strip()
    
    if not phone_to_find:
        return jsonify({"error": "Phone number is required"}), 400

    # 1. Search the ACTIVE queue
    existing_patient = next((p for p in queue if p.get('phone') == phone_to_find), None)

    if existing_patient:
        return jsonify({
            "success": True,
            "patient": {
                **existing_patient,
                "aiAssessment": {
                    "id": existing_patient['id'],
                    "condition": existing_patient.get('disease', ''),
                    "risk_level": existing_patient.get('risk_level', ''),
                    "advice": existing_patient.get('advice', ''),
                    "priority": existing_patient.get('priority', 0)
                }
            }
        }), 200

    # 2. THE FIX: Search the INSTANT Local Cache first
    completed_patient = next((p for p in completed_db if p.get('phone') == phone_to_find), None)
    
    if completed_patient:
        return jsonify({
            "success": True,
            "patient": {
                **completed_patient,
                "aiAssessment": {
                    "id": completed_patient['id'],
                    "condition": completed_patient.get('disease', ''),
                    "risk_level": completed_patient.get('risk_level', ''),
                    "advice": completed_patient.get('advice', ''),
                    "priority": completed_patient.get('priority', 0)
                }
            }
        }), 200

    return jsonify({"error": "No session found for this number."}), 404


if __name__ == '__main__':
    # --- NEW SQLITE ADDITION ---
    with app.app_context():
        db.create_all()  # This creates mediflow.db automatically!
    # ---------------------------
    app.run(host='0.0.0.0', port=5000)
import os
import uuid
import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
from utils import calculate_wait_time, get_peak_hours
from model import predict_disease
from groq import Groq

# -----------------------------
# 🛡️ BULLETPROOF .env LOADER
# -----------------------------
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '.env'))

# 1. Try reading as standard UTF-8
load_dotenv(env_path, override=True, encoding='utf-8')

# 2. If Windows saved it as UTF-16 (from PowerShell), force read it that way!
if not os.environ.get("SUPABASE_URL"):
    load_dotenv(env_path, override=True, encoding='utf-16')
if not os.environ.get("SUPABASE_URL"):
    load_dotenv(env_path, override=True, encoding='utf-16-le')

# -----------------------------
# ☁️ CLOUD DATABASE (SUPABASE)
# -----------------------------
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("CRITICAL: Supabase credentials missing in .env file.")

supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Groq Client for Streaming AI
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

DOCTORS = ["Dr. Sharma", "Dr. Mehta", "Dr. Iyer"]

def assign_doctor(queue_length):
    return DOCTORS[queue_length % len(DOCTORS)]


# -----------------------------
# 🧠 AI Advice Engine & Priority Scanner (UNTOUCHED)
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
# 🚀 CLOUD CONNECTED ROUTES
# -----------------------------

@app.route('/add_patient', methods=['POST'])
def add_patient():
    try:
        data = request.json
        raw_symptoms = data.get('symptoms', [])
        symptoms = [s.strip() for s in raw_symptoms.split(',')] if isinstance(raw_symptoms, str) else raw_symptoms

        name = data.get('name')
        age = int(data.get('age', 0)) if data.get('age') else 0
        weight = int(data.get('weight', 0)) if data.get('weight') else 0
        height = int(data.get('height', 0)) if data.get('height') else 0 
        phone = data.get('phone', '').strip()

        if not name or age == 0:
            return jsonify({"error": "Name and age are required"}), 400

        disease = predict_disease(symptoms)
        priority, reason = analyze_priority(disease, symptoms)
        
        # --- 🚨 QUICK FIX FOR PRESENTATION 🚨 ---
        if priority >= 100 and "General Checkup" in disease:
            disease = "Critical Emergency (Pending Doctor Review)"
        elif priority >= 75 and "General Checkup" in disease:
            disease = "Urgent Care Required"

        risk_level = "High" if priority >= 100 else "Medium" if priority >= 50 else "Low"
        
        # 1. UPSERT PATIENT (Supports returning patients by phone)
        patient_id = str(uuid.uuid4())
        if phone:
            existing = supabase.table('patients').select('id').eq('phone_number', phone).execute()
            if existing.data:
                patient_id = existing.data[0]['id'] # Use existing profile
            else:
                supabase.table('patients').insert({
                    'id': patient_id, 'phone_number': phone, 'full_name': name,
                    'age': age, 'weight_kg': weight, 'height_cm': height
                }).execute()
        else:
            # If no phone is provided, create a guest profile
            supabase.table('patients').insert({
                'id': patient_id, 'phone_number': patient_id, 'full_name': name,
                'age': age, 'weight_kg': weight, 'height_cm': height
            }).execute()

        # 2. LOG THE VISIT (Checkup)
        visit_id = str(uuid.uuid4())
        supabase.table('visits').insert({
            'id': visit_id,
            'patient_id': patient_id,
            'symptoms_log': ", ".join(symptoms),
            'ai_predicted_condition': disease,
            'risk_level': risk_level,
            'queue_priority': priority,
            'status': 'Waiting',
            'doctor_advice': generate_advice(disease, priority)
        }).execute()

        # Calculate Queue Logic dynamically from Cloud DB
        queue_res = supabase.table('visits').select('id', count='exact').eq('status', 'Waiting').gte('queue_priority', priority).execute()
        position = queue_res.count if queue_res.count else 1
        wait_time = (position - 1) * 15

        all_waiting = supabase.table('visits').select('id', count='exact').eq('status', 'Waiting').execute()
        total_in_queue = all_waiting.count if all_waiting.count else 0

        # Respond in the exact format React expects
        return jsonify({
            "id": patient_id,
            "predicted_disease": disease,
            "condition": disease,      
            "risk_level": risk_level,  
            "wait_time": wait_time,
            "priority": priority,
            "reason": reason,
            "assigned_doctor": assign_doctor(total_in_queue),
            "advice": generate_advice(disease, priority)
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/queue', methods=['GET'])
def get_queue():
    try:
        # Join visits and patients tables automatically via Supabase
        res = supabase.table('visits').select('*, patients(*)').eq('status', 'Waiting').order('queue_priority', desc=True).execute()
        
        queue_list = []
        for v in res.data:
            p = v.get('patients', {})
            queue_list.append({
                "id": v['patient_id'],
                "name": p.get('full_name', 'Unknown Patient'),
                "phone": p.get('phone_number', ''),
                "age": p.get('age', 0),
                "weight": p.get('weight_kg', 0),
                "height": p.get('height_cm', 0),
                "symptoms": [s.strip() for s in v.get('symptoms_log', '').split(',')] if v.get('symptoms_log') else [],
                "priority": v.get('queue_priority', 0),
                "disease": v.get('ai_predicted_condition', ''),
                "risk_level": v.get('risk_level', ''),
                "status": v.get('status', 'Waiting'),
                "advice": v.get('doctor_advice', '')
            })
        return jsonify(queue_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/complete_patient/<string:patient_id>', methods=['POST'])
def complete_patient(patient_id):
    try:
        data = request.json or {}
        doctor_advice = data.get('advice', 'Standard treatment applied. Rest and hydrate.')

        # 1. Update the patient's visit to 'Treated'
        active = supabase.table('visits').select('id').eq('patient_id', patient_id).neq('status', 'Treated').order('created_at', desc=True).limit(1).execute()
        
        if active.data:
            supabase.table('visits').update({
                'status': 'Treated',
                'doctor_advice': doctor_advice
            }).eq('id', active.data[0]['id']).execute()
            
            # --- NEW: INVENTORY DEDUCTION LOGIC ---
            # If the doctor prescribes Paracetamol, deduct it automatically!
            if "paracetamol" in doctor_advice.lower():
                # Fetch current stock
                item = supabase.table('inventory').select('quantity').eq('item_name', 'Paracetamol 500mg').execute()
                if item.data and item.data[0]['quantity'] > 0:
                    new_qty = item.data[0]['quantity'] - 10 # Deduct a strip of 10
                    supabase.table('inventory').update({'quantity': new_qty}).eq('item_name', 'Paracetamol 500mg').execute()
            
            return jsonify({"message": "Patient marked as treated. Inventory updated if applicable."})
            
        return jsonify({"error": "Patient not found or already treated."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/call_patient/<string:patient_id>', methods=['POST'])
def call_patient(patient_id):
    try:
        active = supabase.table('visits').select('id').eq('patient_id', patient_id).neq('status', 'Treated').order('created_at', desc=True).limit(1).execute()
        if active.data:
            supabase.table('visits').update({'status': 'Called'}).eq('id', active.data[0]['id']).execute()
            return jsonify({"message": "Patient called successfully"})
            
        return jsonify({"error": "Patient not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/patient_status/<string:patient_id>', methods=['GET'])
def get_patient_status(patient_id):
    try:
        # Pull the patient's most recent checkup
        latest = supabase.table('visits').select('*').eq('patient_id', patient_id).order('created_at', desc=True).limit(1).execute()
        
        if not latest.data:
            return jsonify({"error": "Patient not found"}), 404
            
        v = latest.data[0]
        status = v['status']
        
        if status in ['Treated', 'Called']:
            return jsonify({
                "position": 0, "wait_time": 0, "status": status, "advice": v.get('doctor_advice')
            })
        else:
            # Calculate position in live queue
            higher = supabase.table('visits').select('id', count='exact').eq('status', 'Waiting').gte('queue_priority', v.get('queue_priority', 0)).execute()
            position = higher.count if higher.count else 1
            return jsonify({
                "position": position, 
                "wait_time": (position - 1) * 15,
                "status": "Waiting"
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/patient_history/<string:patient_id>', methods=['GET'])
def get_patient_history(patient_id):
    try:
        # Get all completed checkups OR external uploads
        visits = supabase.table('visits').select('*').eq('patient_id', patient_id).in_('status', ['Treated', 'External']).order('created_at', desc=True).execute()
        
        history_list = []
        for v in visits.data:
            # Parse ISO date back to display format
            date_str = datetime.datetime.fromisoformat(v['created_at']).strftime("%b %d, %Y") if v.get('created_at') else ""
            
            history_list.append({
                "id": v['id'],
                "patient_id": v['patient_id'],
                "date": date_str,
                "condition": v.get('ai_predicted_condition', 'Clinic Checkup'),
                "advice": v.get('doctor_advice', ''),
                "source": "External Doctor" if v.get('status') == 'External' else "Mediflow Clinic",
                "created_at": v.get('created_at', '')
            })
        return jsonify(history_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/add_external_history/<string:patient_id>', methods=['POST'])
def add_external_history(patient_id):
    try:
        data = request.json
        # Inject directly into visits table as 'External'
        supabase.table('visits').insert({
            'id': str(uuid.uuid4()),
            'patient_id': patient_id,
            'ai_predicted_condition': data.get("condition") or data.get("doctor") or "General Checkup",
            'doctor_advice': data.get("advice") or data.get("prescription") or "Rest",
            'status': 'External' # Tags it as past history, keeps it out of the live queue
        }).execute()
        
        return jsonify({"message": "External record added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/retrieve_patient', methods=['POST'])
def retrieve_patient():
    try:
        data = request.json
        phone_to_find = data.get('phone', '').strip()
        
        if not phone_to_find:
            return jsonify({"error": "Phone number is required"}), 400

        # Look up patient profile
        p_res = supabase.table('patients').select('*').eq('phone_number', phone_to_find).execute()
        if not p_res.data:
            return jsonify({"error": "No session found for this number."}), 404
            
        patient = p_res.data[0]
        
        # Get their latest checkup
        v_res = supabase.table('visits').select('*').eq('patient_id', patient['id']).order('created_at', desc=True).limit(1).execute()
        if not v_res.data:
            return jsonify({"error": "No visits found."}), 404
            
        visit = v_res.data[0]
        
        # Package identically to old React payload
        return jsonify({
            "success": True,
            "patient": {
                "id": patient['id'],
                "name": patient['full_name'],
                "phone": patient['phone_number'],
                "age": patient.get('age', 0),
                "weight": patient.get('weight_kg', 0),
                "height": patient.get('height_cm', 0),
                "status": visit['status'],
                "aiAssessment": {
                    "id": patient['id'],
                    "condition": visit.get('ai_predicted_condition', ''),
                    "risk_level": visit.get('risk_level', ''),
                    "advice": visit.get('doctor_advice', ''),
                    "priority": visit.get('queue_priority', 0)
                }
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/doctor_stats', methods=['GET'])
def doctor_stats():
    try:
        waiting = supabase.table('visits').select('id', count='exact').eq('status', 'Waiting').execute()
        critical = supabase.table('visits').select('id', count='exact').eq('status', 'Waiting').gte('queue_priority', 100).execute()
        
        return jsonify({
            "total_patients": waiting.count if waiting.count else 0,
            "critical_cases": critical.count if critical.count else 0
        })
    except Exception as e:
         return jsonify({"error": str(e)}), 500


@app.route('/stream-triage', methods=['POST'])
def stream_triage():
    try:
        data = request.json
        user_message = data.get("message", "")
        chat_history = data.get("history", [])
        
        # Default to English if no language is provided
        language = data.get("language", "English")

        # Explicitly declare output language in the system prompt for accurate alignment 
        messages = [
            {"role": "system", "content": f"You are a professional medical triage assistant. You must communicate exclusively in {language}. Be empathetic, concise, and ask one follow-up question at a time to understand symptoms. If the patient describes an emergency, advise them to seek help immediately."}
        ] + chat_history + [{"role": "user", "content": user_message}]

        def generate():
            stream = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                temperature=0.7,
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        return Response(generate(), mimetype='text/event-stream')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/facility_resources', methods=['GET'])
def get_facility_resources():
    try:
        # Fetch Beds
        beds_res = supabase.table('facility_status').select('*').eq('id', 1).execute()
        
        # Fetch Inventory
        inv_res = supabase.table('inventory').select('*').order('quantity', desc=False).execute()
        
        # --- NEW: PREDICTIVE BURN RATE ALGORITHM ---
        enriched_inventory = []
        for item in inv_res.data:
            # We simulate a "Daily Usage Rate" based on the item type.
            # In a production environment, this would be an ML model predicting future usage based on historical trends.
            if "Paracetamol" in item['item_name']:
                daily_burn = 25  # High usage
            elif "IV Fluids" in item['item_name']:
                daily_burn = 10  # Medium usage
            else:
                daily_burn = 2   # Low usage

            # Calculate days until total stock-out
            days_left = item['quantity'] / daily_burn if daily_burn > 0 else 999
            
            # Inject the prediction back into the data object
            item['daily_burn'] = daily_burn
            item['days_remaining'] = round(days_left)
            enriched_inventory.append(item)
            
        return jsonify({
            "beds": beds_res.data[0] if beds_res.data else {},
            "inventory": enriched_inventory
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health-trends', methods=['GET'])
def get_health_trends():
    try:
        response = supabase.table('visits').select('predicted_disease').not_.is_('predicted_disease', 'null').execute()
        
        trends = {}
        for visit in response.data:
            disease = visit.get('predicted_disease', 'Unknown')
            trends[disease] = trends.get(disease, 0) + 1
            
        return jsonify({"trends": trends}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/update_doctor_status', methods=['POST'])
def update_doctor_status():
    data = request.json
    doctor_id = data.get('doctor_id')
    is_busy = data.get('is_busy')
    
    # Update Supabase
    supabase.table('doctors').update({'is_busy': is_busy}).eq('id', doctor_id).execute()
    
    return jsonify({"success": True}), 200

@app.route('/available-doctors', methods=['GET'])
def get_available_doctors():
    try:
        # Fetch doctors who are online and NOT busy
        response = supabase.table('doctors').select('*').eq('is_online', True).eq('is_busy', False).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/all-doctors', methods=['GET'])
def get_all_doctors():
    try:
        response = supabase.table('doctors').select('*').execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Starts the server!
    app.run(host='0.0.0.0', port=5000)
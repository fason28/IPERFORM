import React, { useState } from 'react';
import { simulateLabExperiment } from '../services/geminiService';
import Spinner from './Spinner';

// Lab Data
const departments = ['Chemistry', 'Biology', 'Physics', 'Computer Science'];

const equipmentList: { [key: string]: string[] } = {
  Chemistry: [
    'HCl', 'H₂SO₄', 'HNO₃', 'NaOH', 'Ammonia', 'Water', 'Ethanol', 'Acetone',
    'NaCl', 'CuSO₄', 'AgNO₃', 'Phenolphthalein', 'Litmus Paper', 'Iodine',
    'Beaker', 'Flask', 'Test Tube', 'Bunsen Burner', 'Hot Plate', 'Thermometer',
    'Magnesium Strip', 'Zinc Granules', 'Iron Filings', 'Potassium Permanganate'
  ],
  Biology: [
    'Microscope', 'Slide', 'Plant Cells', 'Animal Cells', 'E. coli Culture',
    'Yeast Culture', 'Blood Sample', 'DNA Extract', 'Petri Dish', 'Scalpel',
    'Incubator', 'Centrifuge', 'Agar Plate', 'Nutrient Broth', 'Gram Stain',
    'Scalpel', 'Forceps', 'Dissection Pan', 'Cover Slip'
  ],
  Physics: [
    'Battery (9V)', 'Power Supply', 'Copper Wire', 'Light Bulb', 'LED', 'Resistor',
    'Capacitor', 'Switch', 'Voltmeter', 'Ammeter', 'Oscilloscope', 'Glass Prism',
    'Convex Lens', 'Magnet', 'Coil', 'Spring', 'Pendulum', 'Laser Pointer',
    'Mirrors', 'Iron Core'
  ],
  'Computer Science': [
      'Arduino Uno', 'Raspberry Pi', 'Breadboard', 'Jumper Wires', 'Resistor (220Ω)',
      'LED (Red)', 'Push Button', 'Servo Motor', 'Ultrasonic Sensor', 'LCD Display',
      'Python Script', 'C++ Code', 'HTML File', 'CSS Stylesheet', 'JavaScript',
      'SQL Database', 'Router', 'Switch', 'Ethernet Cable', 'CPU', 'RAM Stick'
  ]
};

interface LabResult {
    status: "SAFE" | "CAUTION" | "DANGER" | "CRITICAL";
    observation: string;
    measurements: {
        temperature?: string;
        ph?: string;
        voltage?: string;
        time?: string;
        other?: string;
    };
    safetyAssessment: string;
    nextSteps: string[];
    theory: string;
}

const Lab: React.FC = () => {
    const [activeDept, setActiveDept] = useState('Chemistry');
    const [workbench, setWorkbench] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<LabResult | null>(null);

    const addToWorkbench = (item: string) => {
        if (!workbench.includes(item)) {
            setWorkbench([...workbench, item]);
        }
    };

    const removeFromWorkbench = (item: string) => {
        setWorkbench(workbench.filter(i => i !== item));
    };

    const clearWorkbench = () => {
        setWorkbench([]);
        setResult(null);
    };

    const runExperiment = async () => {
        if (workbench.length === 0) return;
        setIsAnalyzing(true);
        setResult(null);
        try {
            const response = await simulateLabExperiment(workbench);
            setResult(response);
        } catch (error) {
            console.error(error);
            alert("Failed to analyze experiment. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Virtual Science Lab</h2>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {departments.map(dept => (
                        <button
                            key={dept}
                            onClick={() => setActiveDept(dept)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeDept === dept ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Equipment Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col overflow-hidden">
                    <h3 className="font-bold text-slate-700 mb-4">Equipment & Materials ({activeDept})</h3>
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 content-start">
                        {equipmentList[activeDept].map(item => (
                            <button
                                key={item}
                                onClick={() => addToWorkbench(item)}
                                className="text-sm p-2 text-left border border-slate-200 rounded hover:bg-sky-50 hover:border-sky-200 transition-colors"
                            >
                                + {item}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Workbench Panel */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700">Workbench</h3>
                            <div className="flex gap-2">
                                <button onClick={clearWorkbench} className="text-sm text-slate-500 hover:text-red-500 px-3 py-1">Clear All</button>
                                <button 
                                    onClick={runExperiment} 
                                    disabled={workbench.length === 0 || isAnalyzing}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isAnalyzing ? 'Analyzing...' : 'Run Experiment'}
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex-1 p-6 flex flex-wrap content-center justify-center gap-4 min-h-[200px]">
                            {workbench.length === 0 ? (
                                <p className="text-slate-400">Select items from the left to add them to your workbench.</p>
                            ) : (
                                workbench.map(item => (
                                    <div key={item} className="bg-white shadow-md rounded-lg p-3 flex items-center gap-3 border border-slate-200 animate-fade-in">
                                        <div className="bg-sky-100 text-sky-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                                            {item.substring(0,2).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-slate-700">{item}</span>
                                        <button onClick={() => removeFromWorkbench(item)} className="text-slate-400 hover:text-red-500 ml-2">
                                            &times;
                                        </button>
                                    </div>
                                ))
                            )}
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10">
                                    <Spinner size="lg" />
                                    <p className="mt-4 text-slate-600 font-medium animate-pulse">Simulating Reaction...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Panel */}
                    {result && (
                        <div className={`bg-white rounded-xl shadow-lg border-l-8 p-6 animate-slide-up ${
                            result.status === 'SAFE' ? 'border-l-green-500' : 
                            result.status === 'CAUTION' ? 'border-l-yellow-500' : 
                            'border-l-red-600'
                        }`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                                        result.status === 'SAFE' ? 'bg-green-100 text-green-800' :
                                        result.status === 'CAUTION' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {result.status}
                                    </span>
                                    <h3 className="text-xl font-bold text-slate-800">Experiment Analysis</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Observations</h4>
                                    <p className="text-slate-700 mb-4">{result.observation}</p>
                                    
                                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Measurements</h4>
                                    <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                                        {result.measurements.temperature && <div className="flex justify-between"><span>Temp:</span> <span className="font-mono font-bold">{result.measurements.temperature}</span></div>}
                                        {result.measurements.ph && <div className="flex justify-between"><span>pH:</span> <span className="font-mono font-bold">{result.measurements.ph}</span></div>}
                                        {result.measurements.voltage && <div className="flex justify-between"><span>Voltage:</span> <span className="font-mono font-bold">{result.measurements.voltage}</span></div>}
                                        {result.measurements.time && <div className="flex justify-between"><span>Time:</span> <span className="font-mono font-bold">{result.measurements.time}</span></div>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Safety Assessment</h4>
                                    <p className="text-slate-700 mb-4 italic">{result.safetyAssessment}</p>

                                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Scientific Theory</h4>
                                    <p className="text-slate-700 text-sm">{result.theory}</p>
                                </div>
                            </div>
                            
                            {result.nextSteps && result.nextSteps.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Recommended Next Steps</h4>
                                    <ul className="list-disc list-inside text-sm text-sky-700">
                                        {result.nextSteps.map((step, idx) => <li key={idx}>{step}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Lab;
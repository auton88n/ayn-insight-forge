import { useState, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Info, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEngineeringHistory } from '@/hooks/useEngineeringHistory';
import { calculateFoundation } from '@/lib/engineeringCalculations';
import { useLanguage } from '@/contexts/LanguageContext';
import { foundationValidationRules, validateField, hasErrors } from '@/lib/inputValidation';
import { useEngineeringSessionOptional } from '@/contexts/EngineeringSessionContext';
import type { BuildingCodeId } from '@/lib/buildingCodes/types';

interface FoundationCalculatorProps {
  onCalculate: (result: {
    type: 'foundation';
    inputs: Record<string, number | string>;
    outputs: Record<string, number | string | object>;
    timestamp: Date;
  }) => void;
  isCalculating: boolean;
  setIsCalculating: (value: boolean) => void;
  userId?: string;
  resetKey?: number;
  onInputChange?: (inputs: Record<string, any>) => void;
}

const soilTypes = [
  { value: 'soft_clay', bearing: 75, label: 'Soft Clay (75 kN/m²)' },
  { value: 'stiff_clay', bearing: 150, label: 'Stiff Clay (150 kN/m²)' },
  { value: 'loose_sand', bearing: 100, label: 'Loose Sand (100 kN/m²)' },
  { value: 'dense_sand', bearing: 200, label: 'Dense Sand (200 kN/m²)' },
  { value: 'gravel', bearing: 300, label: 'Gravel (300 kN/m²)' },
  { value: 'rock', bearing: 500, label: 'Rock (500 kN/m²)' },
  { value: 'custom', bearing: 0, label: 'Custom Value' },
];

const concreteGrades = [
  { value: 'C25', fck: 25, label: 'C25 (25 MPa)' },
  { value: 'C30', fck: 30, label: 'C30 (30 MPa)' },
  { value: 'C35', fck: 35, label: 'C35 (35 MPa)' },
];

const foundationTypes = [
  { value: 'isolated', label: 'Isolated Footing' },
  { value: 'combined', label: 'Combined Footing' },
  { value: 'strip', label: 'Strip Footing' },
];

const getDefaultFormData = () => ({
  columnLoad: '800',
  momentX: '0',
  momentY: '0',
  columnWidth: '400',
  columnDepth: '400',
  soilType: 'stiff_clay',
  customBearing: '',
  concreteGrade: 'C30',
  foundationType: 'isolated',
  groundwaterDepth: '',
  embedmentDepth: '1.0',
});

// Helper component for form errors
const FormError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="text-destructive text-xs mt-1">{message}</p>;
};

// Get code-specific info
const getCodeInfo = (buildingCode: BuildingCodeId) => {
  if (buildingCode === 'CSA') {
    return {
      name: 'CSA A23.3-24 / NBCC 2020',
      factors: '1.25D + 1.5L',
      phi: 'φc = 0.65',
      isCSA: true,
    };
  }
  return {
    name: 'ACI 318-25 / ASCE 7-22',
    factors: '1.2D + 1.6L',
    phi: 'φ = 0.75 (shear)',
    isCSA: false,
  };
};

export interface FoundationCalculatorRef {
  reset: () => void;
}

export const FoundationCalculator = forwardRef<FoundationCalculatorRef, FoundationCalculatorProps>(
  ({ onCalculate, isCalculating, setIsCalculating, userId, resetKey, onInputChange }, ref) => {
  const { t } = useLanguage();
  const { saveCalculation } = useEngineeringHistory(userId);
  const session = useEngineeringSessionOptional();
  const buildingCode: BuildingCodeId = (session?.buildingCode as BuildingCodeId) || 'ACI';
  const codeInfo = getCodeInfo(buildingCode);
  
  const [formData, setFormData] = useState(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when resetKey changes
  useEffect(() => {
    if (resetKey !== undefined) {
      setFormData(getDefaultFormData());
      setErrors({});
    }
  }, [resetKey]);

  // Expose reset method via ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      setFormData(getDefaultFormData());
      setErrors({});
    }
  }));

  const getBearingCapacity = useCallback(() => {
    if (formData.soilType === 'custom') {
      return parseFloat(formData.customBearing) || 0;
    }
    return soilTypes.find(s => s.value === formData.soilType)?.bearing || 150;
  }, [formData.soilType, formData.customBearing]);

  // Sync inputs to parent on mount and when formData changes
  useEffect(() => {
    const inputs = {
      columnLoad: parseFloat(formData.columnLoad) || 0,
      momentX: parseFloat(formData.momentX) || 0,
      momentY: parseFloat(formData.momentY) || 0,
      columnWidth: parseFloat(formData.columnWidth) || 0,
      columnDepth: parseFloat(formData.columnDepth) || 0,
      bearingCapacity: getBearingCapacity(),
      soilType: formData.soilType,
      concreteGrade: formData.concreteGrade,
      foundationType: formData.foundationType,
      embedmentDepth: parseFloat(formData.embedmentDepth) || 1.0,
      buildingCode,
    };
    onInputChange?.(inputs);
  }, [formData, buildingCode, onInputChange, getBearingCapacity]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate on change
    const numValue = parseFloat(value);
    const rule = foundationValidationRules[field];
    if (rule && !isNaN(numValue)) {
      const error = validateField(numValue, rule);
      setErrors(prev => {
        if (error) {
          return { ...prev, [field]: error };
        }
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateAllInputs = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.entries(foundationValidationRules).forEach(([field, rule]) => {
      const value = parseFloat(formData[field as keyof typeof formData] as string);
      if (!isNaN(value)) {
        const error = validateField(value, rule);
        if (error) newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return !hasErrors(newErrors);
  };

  const handleCalculate = async () => {
    if (!validateAllInputs()) {
      toast.error(t('error.invalidInputDesc'));
      return;
    }

    const columnLoad = parseFloat(formData.columnLoad);
    const bearingCapacity = getBearingCapacity();

    if (isNaN(columnLoad) || columnLoad <= 0) {
      toast.error(t('error.invalidInputDesc'));
      return;
    }
    if (bearingCapacity <= 0) {
      toast.error(t('error.invalidInputDesc'));
      return;
    }

    setIsCalculating(true);

    try {
      // Client-side calculation with building code
      const data = calculateFoundation({
        columnLoad,
        momentX: parseFloat(formData.momentX) || 0,
        momentY: parseFloat(formData.momentY) || 0,
        columnWidth: parseFloat(formData.columnWidth),
        columnDepth: parseFloat(formData.columnDepth),
        bearingCapacity,
        concreteGrade: formData.concreteGrade,
      }, buildingCode);

      const inputs = {
        columnLoad,
        momentX: parseFloat(formData.momentX) || 0,
        momentY: parseFloat(formData.momentY) || 0,
        columnWidth: parseFloat(formData.columnWidth),
        columnDepth: parseFloat(formData.columnDepth),
        bearingCapacity,
        soilType: formData.soilType,
        concreteGrade: formData.concreteGrade,
        foundationType: formData.foundationType,
        embedmentDepth: parseFloat(formData.embedmentDepth) || 1.0,
        buildingCode,
      };

      // Save to history (non-blocking)
      saveCalculation('foundation', inputs, data);

      onCalculate({
        type: 'foundation',
        inputs,
        outputs: data,
        timestamp: new Date(),
      });

      toast.success(t('common.success'));
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Calculation error:', err);
      }
      toast.error(t('error.calculationFailedDesc'));
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Foundation Design Calculator</h2>
            <p className="text-sm text-muted-foreground">Isolated Footing Design</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Column Loads Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Column Loads
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="columnLoad">Axial Load (kN)</Label>
                <Input
                  id="columnLoad"
                  type="number"
                  placeholder="e.g., 800"
                  value={formData.columnLoad}
                  onChange={(e) => handleInputChange('columnLoad', e.target.value)}
                  step="10"
                  min="0"
                  className={errors.columnLoad ? 'border-destructive' : ''}
                />
                <FormError message={errors.columnLoad} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="momentX">Moment X (kN·m)</Label>
                <Input
                  id="momentX"
                  type="number"
                  placeholder="0"
                  value={formData.momentX}
                  onChange={(e) => handleInputChange('momentX', e.target.value)}
                  step="5"
                  className={errors.momentX ? 'border-destructive' : ''}
                />
                <FormError message={errors.momentX} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="momentY">Moment Y (kN·m)</Label>
                <Input
                  id="momentY"
                  type="number"
                  placeholder="0"
                  value={formData.momentY}
                  onChange={(e) => handleInputChange('momentY', e.target.value)}
                  step="5"
                  className={errors.momentY ? 'border-destructive' : ''}
                />
                <FormError message={errors.momentY} />
              </div>
            </div>
          </div>

          {/* Column Dimensions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Column Dimensions
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="columnWidth">Column Width (mm)</Label>
                <Input
                  id="columnWidth"
                  type="number"
                  placeholder="e.g., 400"
                  value={formData.columnWidth}
                  onChange={(e) => handleInputChange('columnWidth', e.target.value)}
                  step="25"
                  min="200"
                  className={errors.columnWidth ? 'border-destructive' : ''}
                />
                <FormError message={errors.columnWidth} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="columnDepth">Column Depth (mm)</Label>
                <Input
                  id="columnDepth"
                  type="number"
                  placeholder="e.g., 400"
                  value={formData.columnDepth}
                  onChange={(e) => handleInputChange('columnDepth', e.target.value)}
                  step="25"
                  min="200"
                  className={errors.columnDepth ? 'border-destructive' : ''}
                />
                <FormError message={errors.columnDepth} />
              </div>
            </div>
          </div>

          {/* Soil Properties */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Soil Properties
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Soil Type</Label>
                <Select value={formData.soilType} onValueChange={(v) => handleInputChange('soilType', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {soilTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.soilType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customBearing">Bearing Capacity (kN/m²)</Label>
                  <Input
                    id="customBearing"
                    type="number"
                    placeholder="e.g., 150"
                    value={formData.customBearing}
                    onChange={(e) => handleInputChange('customBearing', e.target.value)}
                    step="10"
                    min="0"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="embedmentDepth">Embedment Depth (m)</Label>
                <Input
                  id="embedmentDepth"
                  type="number"
                  placeholder="e.g., 1.0"
                  value={formData.embedmentDepth}
                  onChange={(e) => handleInputChange('embedmentDepth', e.target.value)}
                  step="0.1"
                  min="0.5"
                  className={errors.embedmentDepth ? 'border-destructive' : ''}
                />
                <FormError message={errors.embedmentDepth} />
              </div>
            </div>
          </div>

          {/* Materials Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Materials
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Concrete Grade</Label>
                <Select value={formData.concreteGrade} onValueChange={(v) => handleInputChange('concreteGrade', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {concreteGrades.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Foundation Type</Label>
                <Select value={formData.foundationType} onValueChange={(v) => handleInputChange('foundationType', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {foundationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dynamic Info Box based on building code */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl border",
            codeInfo.isCSA 
              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
          )}>
            {codeInfo.isCSA ? (
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <p className="font-medium mb-1">Design Code: {codeInfo.name}</p>
              <p className="text-amber-600 dark:text-amber-400">
                Load factors: {codeInfo.factors}, {codeInfo.phi}. 
                Bearing capacity FOS = 3.0. Punching shear at d/2 from column.
              </p>
              {codeInfo.isCSA && (
                <p className="text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ CSA uses lower resistance factors - expect larger footing
                </p>
              )}
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5 mr-2" />
                Calculate Foundation Design
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
});

FoundationCalculator.displayName = 'FoundationCalculator';

export default FoundationCalculator;

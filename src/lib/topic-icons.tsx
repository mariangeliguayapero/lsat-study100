import {
  Variable,
  Triangle,
  BarChart3,
  Sigma,
  Calculator,
  Compass,
  PieChart,
  TrendingUp,
  Brain,
  BookOpen,
  Layers,
  PenTool,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";

const slugToIcon: Record<string, LucideIcon> = {
  // LSAT
  "logical-reasoning": Brain,
  "reading-comprehension": BookOpen,
  "flaw-questions": Brain,
  "assumption-questions": CheckSquare,
  "strengthen-weaken": TrendingUp,
  "main-point-structure": Layers,
  "inference-detail": BookOpen,

  // Math
  algebra: Variable,
  geometry: Triangle,
  statistics: BarChart3,
  "advanced-math": Sigma,
  "problem-solving": Calculator,
  trigonometry: Compass,
  "data-analysis": PieChart,
  "linear-equations": TrendingUp,
  // Reading & Writing
  "information-and-ideas": BookOpen,
  "craft-and-structure": Layers,
  "expression-of-ideas": PenTool,
  "standard-english-conventions": CheckSquare,
};

const fallbackIcon = Calculator;

export function getTopicIcon(slug: string): LucideIcon {
  return slugToIcon[slug] ?? fallbackIcon;
}

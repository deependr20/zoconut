import mongoose, { Schema } from 'mongoose';
import { IRecipe, INutrition } from '@/types';

const nutritionSchema = new Schema<INutrition>({
  calories: {
    type: Number,
    required: true,
    min: 0
  },
  protein: {
    type: Number,
    required: true,
    min: 0
  },
  carbs: {
    type: Number,
    required: true,
    min: 0
  },
  fat: {
    type: Number,
    required: true,
    min: 0
  },
  fiber: {
    type: Number,
    min: 0
  },
  sugar: {
    type: Number,
    min: 0
  },
  sodium: {
    type: Number,
    min: 0
  }
});

const ingredientSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  }
});

const recipeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  ingredients: {
    type: [ingredientSchema],
    required: true,
    validate: {
      validator: function(ingredients: any[]) {
        return ingredients.length > 0;
      },
      message: 'Recipe must have at least one ingredient'
    }
  },
  instructions: {
    type: [String],
    required: true,
    validate: {
      validator: function(instructions: string[]) {
        return instructions.length > 0;
      },
      message: 'Recipe must have at least one instruction'
    }
  },
  prepTime: {
    type: Number,
    required: true,
    min: 0
  },
  cookTime: {
    type: Number,
    required: true,
    min: 0
  },
  servings: {
    type: Number,
    required: true,
    min: 1
  },
  nutrition: {
    type: nutritionSchema,
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  image: {
    type: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better search performance
recipeSchema.index({ name: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ tags: 1 });
recipeSchema.index({ createdBy: 1 });
recipeSchema.index({ 'nutrition.calories': 1 });

// Virtual for total time
recipeSchema.virtual('totalTime').get(function() {
  return this.prepTime + this.cookTime;
});

// Virtual for nutrition per serving
recipeSchema.virtual('nutritionPerServing').get(function() {
  return {
    calories: Math.round(this.nutrition.calories / this.servings),
    protein: Math.round((this.nutrition.protein / this.servings) * 10) / 10,
    carbs: Math.round((this.nutrition.carbs / this.servings) * 10) / 10,
    fat: Math.round((this.nutrition.fat / this.servings) * 10) / 10,
    fiber: this.nutrition.fiber ? Math.round((this.nutrition.fiber / this.servings) * 10) / 10 : undefined,
    sugar: this.nutrition.sugar ? Math.round((this.nutrition.sugar / this.servings) * 10) / 10 : undefined,
    sodium: this.nutrition.sodium ? Math.round(this.nutrition.sodium / this.servings) : undefined
  };
});

// Static method to search recipes
recipeSchema.statics.searchRecipes = function(query: string, filters?: any) {
  const searchQuery: any = {};
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  if (filters) {
    if (filters.tags && filters.tags.length > 0) {
      searchQuery.tags = { $in: filters.tags };
    }
    
    if (filters.maxCalories) {
      searchQuery['nutrition.calories'] = { $lte: filters.maxCalories };
    }
    
    if (filters.minProtein) {
      searchQuery['nutrition.protein'] = { $gte: filters.minProtein };
    }
    
    if (filters.maxPrepTime) {
      searchQuery.prepTime = { $lte: filters.maxPrepTime };
    }
  }
  
  return this.find(searchQuery).populate('createdBy', 'firstName lastName');
};

// Ensure virtual fields are serialized
recipeSchema.set('toJSON', {
  virtuals: true
});

const Recipe = mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', recipeSchema);

export default Recipe;

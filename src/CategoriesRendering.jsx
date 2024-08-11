import React, { useState, useEffect } from 'react';
import categories from './categories.json';
import './App.css';

// Component to handle rendering and updating of a single SVG
const DynamicSVG = ({ svgData }) => {
  const [params, setParams] = useState(
    svgData.parameters.reduce((acc, param) => {
      acc[param.shortName] = param.default;
      return acc;
    }, {})
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setParams({
      ...params,
      [name]: parseFloat(value),
    });
  };

  const resolveDependencies = (dependencies, params) => {
    const resolvedDependencies = {};
    for (const [key, expr] of Object.entries(dependencies)) {
      if (typeof expr === 'string') {
        const resolvedValue = expr.replace(/\{(\w+)\}/g, (_, p1) => params[p1] !== undefined ? params[p1] : resolvedDependencies[p1]);
        try {
          resolvedDependencies[key] = new Function(...Object.keys(params), `return ${resolvedValue};`)(...Object.values(params));
        } catch (error) {
          console.error(`Error evaluating dependency: ${expr}`, error);
          resolvedDependencies[key] = 0;
        }
      } else {
        resolvedDependencies[key] = expr; // If expr is not a string, just assign it directly
      }
    }
    return resolvedDependencies;
  };
  

  const processLoops = (svgContent, loops, params, resolvedDependencies) => {
    if (!loops) return svgContent;

    loops.forEach(loop => {
      let loopContent = '';
      const loopCount = params[loop.countParam] !== undefined ? params[loop.countParam] : loop.count;

      for (let i = 0; i < loopCount; i++) {
        let itemContent = loop.template.replace(/\{i\}/g, i);

        // Replace placeholders with actual values
        itemContent = itemContent.replace(/\{([^}]+)\}/g, (_, expr) => {
          const evalExpr = new Function('i', ...Object.keys(params), ...Object.keys(resolvedDependencies), `return ${expr};`);
          try {
            return evalExpr(i, ...Object.values(params), ...Object.values(resolvedDependencies));
          } catch (error) {
            console.error(`Error evaluating expression: ${expr}`, error);
            return `{${expr}}`;
          }
        });

        loopContent += itemContent;
      }

      // Replace the placeholder in the svgContent with generated loop content
      const regex = new RegExp(`{${loop.name}}`, 'g');
      svgContent = svgContent.replace(regex, loopContent);
    });

    return svgContent;
  };

  const renderSVGContent = () => {
    let svgContent = svgData.svgContent;

    const resolvedDependencies = resolveDependencies(svgData.dependencies || {}, params);

    // Process loops if any
    svgContent = processLoops(svgContent, svgData.loops || [], params, resolvedDependencies);

    // Replace remaining placeholders with actual values
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      svgContent = svgContent.replace(regex, value);
    }

    for (const [key, value] of Object.entries(resolvedDependencies)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      svgContent = svgContent.replace(regex, value);
    }

    svgContent = svgContent.replace(/\{([^}]+)\}/g, (_, expr) => {
      const evalExpr = new Function(...Object.keys(params), ...Object.keys(resolvedDependencies), `return ${expr};`);
      try {
        return evalExpr(...Object.values(params), ...Object.values(resolvedDependencies));
      } catch (error) {
        console.error(`Error evaluating expression: ${expr}`, error);
        return `{${expr}}`;
      }
    });

    return svgContent;
  };

  const [svgContent, setSvgContent] = useState(renderSVGContent());

  useEffect(() => {
    setSvgContent(renderSVGContent());
  }, [params, svgData]);

  return (
    <div className="svg-container">
      <h2>{svgData.name}</h2>
      <div className="svg-wrapper" dangerouslySetInnerHTML={{ __html: svgContent }} />
      <div className="parameters">
        {svgData.parameters.map((param) => (
          <div key={param.shortName} className="parameter">
            <label>{param.name}: </label>
            <input
              type="number"
              name={param.shortName}
              value={params[param.shortName]}
              onChange={handleInputChange}
              step="1"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Main App component to render SVGs based on selected category
const CategoriesRender = () => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].mainCategory);
  const [currentSVGs, setCurrentSVGs] = useState(categories[0].subCategories);

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    const categoryData = categories.find(cat => cat.mainCategory === category);
    setCurrentSVGs(categoryData.subCategories);
  };

  return (
    <div className="app">
      <div className="category-selector">
        <label htmlFor="category">Select Category: </label>
        <select id="category" value={selectedCategory} onChange={handleCategoryChange}>
          {categories.map((category, index) => (
            <option key={index} value={category.mainCategory}>
              {category.mainCategory}
            </option>
          ))}
        </select>
      </div>
      {currentSVGs.map((svgData, index) => (
        <DynamicSVG key={`${selectedCategory}-${index}`} svgData={svgData} />
      ))}
    </div>
  );
};

export default CategoriesRender;

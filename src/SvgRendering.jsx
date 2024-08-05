import React, { useState, useEffect } from 'react';
import svgs from './svgs.json';
import './App.css';

// Component to handle rendering and updating of a single SVG
const DynamicSVG = ({ svgData }) => {
  // Initialize state with default parameter values
  const [params, setParams] = useState(
    svgData.parameters.reduce((acc, param) => {
      acc[param.shortName] = param.default;
      return acc;
    }, {})
  );

  // Function to handle input changes and update state
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setParams({
      ...params,
      [name]: parseFloat(value),
    });
  };

  // Function to resolve dependencies and replace placeholders with calculated values
  const resolveDependencies = (dependencies) => {
    const resolvedDependencies = {};
    for (const [key, expr] of Object.entries(dependencies)) {
      const resolvedValue = expr.replace(/\{(\w+)\}/g, (_, p1) => params[p1] || resolvedDependencies[p1]);
      try {
        resolvedDependencies[key] = eval(resolvedValue);
      } catch (error) {
        console.error(`Error evaluating dependency: ${expr}`, error);
      }
    }
    return resolvedDependencies;
  };

  // Function to replace parameter placeholders with current values and resolve dependencies
  const renderSVGContent = () => {
    let svgContent = svgData.svgContent;

    // Resolve dependencies first
    const resolvedDependencies = resolveDependencies(svgData.dependencies);

    // Replace all simple parameter placeholders
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      svgContent = svgContent.replace(regex, value);
    }

    // Replace dependencies
    for (const [key, value] of Object.entries(resolvedDependencies)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      svgContent = svgContent.replace(regex, value);
    }

    // Then, handle any remaining expressions within the SVG content
    svgContent = svgContent.replace(/\{([^}]+)\}/g, (_, expr) => {
      // Create a function to evaluate the expression with current parameters and resolved dependencies
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
  }, [params]);

  return (
    <div className="svg-container">
      {/* Heading for the SVG */}
      <h2>{svgData.name}</h2>
      {/* Render the SVG */}
      <div className="svg-wrapper" dangerouslySetInnerHTML={{ __html: svgContent }} />
      {/* Render input fields for each parameter */}
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

// Main App component to render all SVGs
const SvgRendering = () => {
  return (
    <div className="app">
      {svgs.map((svgData, index) => (
        <DynamicSVG key={index} svgData={svgData} />
      ))}
    </div>
  );
};

export default SvgRendering;

# Derivatives Pricing Tool

A derivatives-pricing web application supporting pricing calculations and risk analysis for multiple financial products.

## Features

- ✅ **Multiple product types**
  - Vanilla Options - Black-Scholes model
  - Asian Options - Monte Carlo simulation
  - FCN (Fixed Coupon Note) - Monte Carlo simulation
  - Accumulator - Monte Carlo simulation
  - Decumulator - Monte Carlo simulation

- ✅ **Greeks calculations**
  - Delta (price sensitivity)
  - Gamma (sensitivity of Delta)
  - Theta (time decay)
  - Vega (volatility sensitivity)
  - Rho (interest-rate sensitivity)

- ✅ **Visual analysis**
  - Price-sensitivity charts
  - Interactive results display

- ✅ **Calculation history**
  - Automatically save calculation results
  - View and compare historical results
  - Filter by product type

- ✅ **Batch calculations**
  - Generate parameter combinations from a base set of inputs
  - Calculate and compare results in batches

- ✅ **Data export**
  - Export to Excel
  - Export to CSV

- ✅ **Mobile support**
  - Responsive design
  - Accessible on mobile devices

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Routing**: React Router
- **Data export**: xlsx

## Installation and Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

The application starts at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

Build output is written to the `dist` directory.

### Preview the Production Build

```bash
npm run preview
```

## Usage

### 1. Choose a Product Type

Select a product on the home page, such as a vanilla option, Asian option, or FCN.

### 2. Enter Parameters

Enter the parameters required for the selected product:

- **Spot price (S)**: Current price of the underlying asset
- **Strike price (K)**: Option exercise price
- **Risk-free rate (r)**: Annual risk-free interest rate; for example, 0.05 means 5%
- **Volatility (σ)**: Annualized volatility; for example, 0.2 means 20%
- **Time to maturity (T)**: Time in years; for example, 0.25 means three months

### 3. View Results

Click the calculate-price button to display:

- The theoretical price of the option or product
- Greeks (risk measures)
- Price-sensitivity charts

### 4. Calculation History

Calculation results are saved automatically. You can:

- View previous results
- Filter by product type
- Export to Excel or CSV

### 5. Batch Calculations

On the batch-calculation page:

- Set the base parameters
- Generate multiple combinations, such as different spot prices
- Calculate and compare the results in a batch

## Pricing Models

### Vanilla Options

Uses the classic Black-Scholes model with an analytical solution and Greeks calculations.

### Asian Options

Uses Monte Carlo simulation and supports both arithmetic-average and geometric-average options.

### FCN

Uses Monte Carlo simulation to account for knock-out and knock-in provisions.

### Accumulator / Decumulator

Uses Monte Carlo simulation to account for barrier levels and cumulative payoff mechanics.

## Notes

1. **Numerical accuracy**: Monte Carlo accuracy depends on the number of simulations. The documented configuration uses 50,000 simulations, so calculations may take several seconds.

2. **Parameter units**:
   - Enter interest rates and volatility as decimals (5% = 0.05)
   - Enter time in years (three months = 0.25 years)

3. **Data storage**: Calculation history is stored in the browser's localStorage. Clearing browser data removes that history.

## Roadmap

- [ ] Support additional derivative types
- [ ] Add more pricing-model options
- [ ] Improve sensitivity-analysis accuracy
- [ ] Add parameter validation and error messages
- [ ] Support English and Chinese interfaces
- [ ] Add user-defined parameter ranges

## License

MIT License

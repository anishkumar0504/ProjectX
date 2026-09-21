/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SmoothScroll } from "./components/SmoothScroll";
import { ReportGenerator } from "./pages/ReportGenerator";

export default function App() {
  return (
    <SmoothScroll>
      <ReportGenerator />
    </SmoothScroll>
  );
}


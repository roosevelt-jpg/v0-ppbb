import XCTest
@testable import VerbaLab

final class VerbaLabClientTests: XCTestCase {
    func testAcceptsLivePrefix() {
        let client = VerbaLabClient(apiKey: "vl_live_test", baseURL: "http://127.0.0.1:3001")
        XCTAssertEqual(client.apiKey, "vl_live_test")
        XCTAssertTrue(client.baseURL.absoluteString.contains("127.0.0.1"))
    }

    func testAcceptsTestPrefix() {
        let client = VerbaLabClient(apiKey: "vl_test_demo", baseURL: "https://api.verbalab.ai")
        XCTAssertEqual(client.apiKey, "vl_test_demo")
    }
}

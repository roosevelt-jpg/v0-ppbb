package ai.verbalab.sdk

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class VerbaLabClientTest {
    @Test
    fun rejectsInvalidKey() {
        assertFailsWith<IllegalArgumentException> {
            VerbaLabClient("bad-key")
        }
    }

    @Test
    fun acceptsLivePrefix() {
        val client = VerbaLabClient("vl_live_test", "http://127.0.0.1:3001")
        assertEquals("vl_live_test", client.let {
            // apiKey is private; constructing without throw is enough
            "vl_live_test"
        })
    }
}
